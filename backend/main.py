import dash
import dash_bootstrap_components as dbc
from dash import dcc, html, ctx
from dash.dependencies import Input, Output, State
import plotly.graph_objects as go
import numpy as np
import nibabel as nib
from skimage import measure, filters, draw
import base64
import tempfile
import os
import re

# ---------------- CONFIG ----------------

external_stylesheets = [dbc.themes.DARKLY]

app = dash.Dash(
    __name__,
    external_stylesheets=external_stylesheets,
    suppress_callback_exceptions=True,
)

server = app.server

THEME_COLOR = "#2da1ad"
SEG_COLOR   = "#ff4466"
BG_COLOR    = "#000000"

# Mesh principal fix
MAIN_HU_MIN = 130
MAIN_HU_MAX = 930

# Presetari HU pentru segmentare
HU_PRESETS = {
    "Plamani (aer)"     : (-950, -300),
    "Grasime"           : (-190,  -30),
    "Tesuturi moi"      : (  -30,  80),
    "Sange / organe"    : (   40, 120),
    "Os cortical"       : (  300, 930),
    "Os spongios"       : (  130, 300),
    "Custom"            : None,           # range manual
}

# ---------------- GLOBAL STATE ----------------
global_img       = None   # (nz, ny, nx) float32
global_blurred   = None   # (nz, ny, nx) float32
global_spacing   = None
global_seg_mask          = None   # (nz, ny, nx) bool  – masca finala combinata
global_seg_mask_axial    = None   # (nz, ny, nx) bool  – regiune desenata pe axial
global_seg_mask_sagittal = None   # (nz, ny, nx) bool  – regiune desenata pe sagittal
global_seg_mask_coronal  = None   # (nz, ny, nx) bool  – regiune desenata pe coronal
global_main_mask         = None   # (nz, ny, nx) bool  – mesh principal fix

# ---------------- HELPERS ----------------

def _make_slice_fig(slice_2d, draw_mode=False, seg_overlay=None):
    fig = go.Figure()
    fig.add_trace(go.Heatmap(
        z=slice_2d, colorscale="Gray", showscale=False,
        hovertemplate="HU: %{z:.0f}<extra></extra>",
    ))
    if seg_overlay is not None and seg_overlay.any():
        ov = np.where(seg_overlay, 1.0, np.nan).astype(float)
        fig.add_trace(go.Heatmap(
            z=ov,
            colorscale=[[0, "rgba(255,68,102,0.45)"], [1, "rgba(255,68,102,0.45)"]],
            showscale=False, hoverinfo="skip",
        ))
    fig.update_layout(
        paper_bgcolor=BG_COLOR, plot_bgcolor=BG_COLOR,
        margin=dict(l=0, r=0, t=0, b=0),
        dragmode="drawclosedpath" if draw_mode else "pan",
        newshape=dict(line=dict(color=SEG_COLOR, width=2),
                      fillcolor="rgba(255,68,102,0.12)"),
        xaxis=dict(visible=False, scaleanchor="y", scaleratio=1),
        yaxis=dict(visible=False, autorange="reversed"),
        uirevision="slice",
    )
    return fig


def _parse_path_to_mask(path_str, slice_shape):
    coords = re.findall(r"[-+]?\d*\.?\d+,[-+]?\d*\.?\d+", path_str)
    if len(coords) < 3:
        return None
    pts   = [tuple(map(float, c.split(","))) for c in coords]
    xs    = np.array([p[0] for p in pts])
    ys    = np.array([p[1] for p in pts])
    rows, cols = slice_shape
    xs_px = np.clip(np.round(xs).astype(int), 0, cols - 1)
    ys_px = np.clip(np.round(ys).astype(int), 0, rows - 1)
    mask  = np.zeros(slice_shape, dtype=bool)
    rr, cc = draw.polygon(ys_px, xs_px, shape=slice_shape)
    mask[rr, cc] = True
    return mask


def _3d_layout():
    return dict(
        template="plotly_dark",
        paper_bgcolor=BG_COLOR, plot_bgcolor=BG_COLOR,
        margin=dict(l=0, r=0, b=0, t=0),
        uirevision="3d-keep",
        scene=dict(
            aspectmode="data",
            xaxis=dict(backgroundcolor=BG_COLOR, gridcolor="#1a1a1a"),
            yaxis=dict(backgroundcolor=BG_COLOR, gridcolor="#1a1a1a"),
            zaxis=dict(backgroundcolor=BG_COLOR, gridcolor="#1a1a1a"),
            bgcolor=BG_COLOR,
        ),
    )


def _build_3d(main_mask=None, seg_mask=None):
    traces = []
    if main_mask is not None and main_mask.sum() > 100:
        try:
            v, f, _, _ = measure.marching_cubes(main_mask.astype(np.uint8), level=0.5, step_size=3)
            traces.append(go.Mesh3d(
                x=v[:, 2], y=v[:, 1], z=v[:, 0],
                i=f[:, 0], j=f[:, 1], k=f[:, 2],
                opacity=0.13, color=THEME_COLOR, name="Anatomie (130–930 HU)",
            ))
        except Exception:
            pass
    if seg_mask is not None and seg_mask.sum() > 10:
        try:
            v2, f2, _, _ = measure.marching_cubes(seg_mask.astype(np.uint8), level=0.5, step_size=2)
            traces.append(go.Mesh3d(
                x=v2[:, 2], y=v2[:, 1], z=v2[:, 0],
                i=f2[:, 0], j=f2[:, 1], k=f2[:, 2],
                opacity=1.0,
                color="#ffffff",
                flatshading=False,
                lighting=dict(
                    ambient=0.3,
                    diffuse=0.85,
                    specular=0.5,
                    roughness=0.4,
                    fresnel=0.3,
                ),
                lightposition=dict(x=1000, y=1000, z=2000),
                name="Regiune segmentată",
            ))
        except Exception:
            pass
    if not traces:
        traces.append(go.Scatter3d(x=[], y=[], z=[]))
    fig = go.Figure(data=traces)
    fig.update_layout(**_3d_layout())
    return fig


def _extract_path(relay):
    """Extrage SVG path din relayoutData indiferent de format."""
    if not relay:
        return None
    if "shapes" in relay and relay["shapes"]:
        last = relay["shapes"][-1]
        if isinstance(last, dict) and "path" in last:
            return last["path"]
    path_keys = [k for k in relay if re.match(r"shapes\[\d+\]\.path", k)]
    if path_keys:
        return relay[sorted(path_keys)[-1]]
    return None


# ---------------- LAYOUT ----------------

app.layout = html.Div(
    style={"backgroundColor": BG_COLOR, "color": "#fff", "minHeight": "100vh", "padding": "20px"},
    children=[
        dcc.Upload(
            id="upload-data",
            children=html.Div(["Trage sau ", html.A("Selectează fișier NIfTI (.nii / .nii.gz)")]),
            style={
                "width": "100%", "height": "60px", "lineHeight": "60px",
                "borderWidth": "1px", "borderStyle": "dashed", "borderRadius": "20px",
                "textAlign": "center", "borderColor": THEME_COLOR,
                "backgroundColor": "rgba(45,161,173,0.05)", "cursor": "pointer",
                "marginBottom": "16px",
            },
            multiple=False,
        ),

        html.Div(id="status-bar"),

        # --- TOOLBAR MINIMAL (static) ---
        html.Div(id="seg-toolbar", style={"display": "none"}, children=[
            html.Div([
                # HU preset
                html.Span("HU:", style={
                    "fontFamily": "monospace", "fontSize": "11px",
                    "color": "#aaa", "marginRight": "8px",
                }),
                dcc.Dropdown(
                    id="hu-preset-dropdown",
                    options=[{"label": k, "value": k} for k in HU_PRESETS],
                    value="Plamani (aer)",
                    clearable=False,
                    style={
                        "width": "180px", "marginRight": "10px",
                        "backgroundColor": "#111", "color": "#000",
                        "border": f"1px solid {SEG_COLOR}55",
                        "fontFamily": "monospace", "fontSize": "12px",
                    },
                ),
                # Custom HU inputs
                html.Div([
                    html.Span("Min:", style={"fontSize": "11px", "color": "#aaa",
                                             "marginRight": "4px", "fontFamily": "monospace"}),
                    dcc.Input(id="hu-custom-min", type="number", value=-200,
                              style={"width": "65px", "marginRight": "6px",
                                     "backgroundColor": "#111", "color": "#fff",
                                     "border": "1px solid #444", "borderRadius": "4px",
                                     "fontFamily": "monospace", "fontSize": "12px", "padding": "2px 6px"}),
                    html.Span("Max:", style={"fontSize": "11px", "color": "#aaa",
                                             "marginRight": "4px", "fontFamily": "monospace"}),
                    dcc.Input(id="hu-custom-max", type="number", value=200,
                              style={"width": "65px", "marginRight": "10px",
                                     "backgroundColor": "#111", "color": "#fff",
                                     "border": "1px solid #444", "borderRadius": "4px",
                                     "fontFamily": "monospace", "fontSize": "12px", "padding": "2px 6px"}),
                ], id="hu-custom-inputs", style={"display": "none", "alignItems": "center"}),

                html.Span(id="hu-range-preview", style={
                    "fontFamily": "monospace", "fontSize": "11px",
                    "color": SEG_COLOR, "marginRight": "16px",
                }),

                # Status voxeli
                html.Span(id="axial-region-status", children="", style={
                    "fontFamily": "monospace", "fontSize": "11px", "color": "#555",
                    "marginRight": "8px",
                }),
                html.Span(id="sagittal-region-status", children="", style={
                    "fontFamily": "monospace", "fontSize": "11px", "color": "#555",
                    "marginRight": "8px",
                }),
                html.Span(id="coronal-region-status", children="", style={
                    "fontFamily": "monospace", "fontSize": "11px", "color": "#555",
                    "marginRight": "16px",
                }),

                # Placeholder-uri necesare pentru callbacks (ascunse)
                html.Span(id="draw-mode-indicator", style={"display": "none"}),

                # Buton Generează Mesh
                dbc.Button("⚡ Generează Mesh", id="btn-generate-mesh", size="sm", color="success",
                           style={"marginRight": "8px", "fontFamily": "monospace",
                                  "fontSize": "11px", "fontWeight": "bold"}),

                # Buton Reset
                dbc.Button("🗑 Reset segmentare", id="btn-seg-reset", size="sm",
                           outline=True, color="danger",
                           style={"marginRight": "16px", "fontFamily": "monospace", "fontSize": "11px"}),

                # Buton Fullscreen
                dbc.Button("⛶ Fullscreen", id="btn-fullscreen", size="sm",
                           outline=True, color="light",
                           style={"fontFamily": "monospace", "fontSize": "11px"}),

                # Placeholder-uri ascunse pentru butoanele eliminate (callbacks le asteapta)
                html.Div([
                    dbc.Button(id="btn-draw-axial",    n_clicks=0, style={"display": "none"}),
                    dbc.Button(id="btn-draw-sagittal", n_clicks=0, style={"display": "none"}),
                    dbc.Button(id="btn-draw-stop",     n_clicks=0, style={"display": "none"}),
                ]),

            ], style={
                "display": "flex", "alignItems": "center", "flexWrap": "wrap",
                "gap": "4px", "padding": "10px 14px", "marginBottom": "14px",
                "border": f"1px solid #222", "borderRadius": "8px",
                "backgroundColor": "#0a0a0a",
            }),
        ]),

        html.Div(id="main-content-area"),

        dcc.Store(id="volume-loaded",      data=False),
        dcc.Store(id="draw-mode-active",   data=False),
        dcc.Store(id="draw-source",        data=None),
        dcc.Store(id="seg-update-counter", data=0),

        # Script fullscreen
        html.Script("""
            document.addEventListener('DOMContentLoaded', function() {
                window._fsTarget = null;
            });
        """),
    ],
)

# ---------------- UPLOAD ----------------

@app.callback(
    Output("status-bar",        "children"),
    Output("volume-loaded",     "data"),
    Output("main-content-area", "children"),
    Output("seg-toolbar",       "style"),
    Input("upload-data",        "contents"),
    prevent_initial_call=True,
)
def process_upload(contents):
    global global_img, global_blurred, global_spacing, global_seg_mask, global_main_mask
    global global_seg_mask_axial, global_seg_mask_sagittal, global_seg_mask_coronal

    if contents is None:
        return dash.no_update, dash.no_update, dash.no_update, dash.no_update

    try:
        _, content_string = contents.split(",")
        decoded = base64.b64decode(content_string)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".nii.gz") as tf:
            tf.write(decoded)
            temp_path = tf.name
        try:
            img_data = nib.load(temp_path)
            img_raw  = img_data.get_fdata()
            affine   = img_data.affine
        finally:
            os.remove(temp_path)

        sx = abs(float(affine[0, 0]))
        sy = abs(float(affine[1, 1]))
        sz = abs(float(affine[2, 2]))

        img             = np.transpose(img_raw, (2, 1, 0))
        global_spacing  = (sz, sy, sx)
        global_img      = img.astype(np.float32)
        med             = filters.median(global_img)
        global_blurred  = filters.gaussian(med, sigma=0.8).astype(np.float32)

        nz, ny, nx = global_img.shape
        global_seg_mask          = np.zeros((nz, ny, nx), dtype=bool)
        global_seg_mask_axial    = np.zeros((nz, ny, nx), dtype=bool)
        global_seg_mask_sagittal = np.zeros((nz, ny, nx), dtype=bool)
        global_seg_mask_coronal  = np.zeros((nz, ny, nx), dtype=bool)
        # Mesh principal FIX 130–930 HU
        global_main_mask = (global_blurred >= MAIN_HU_MIN) & (global_blurred <= MAIN_HU_MAX)

        vol_min = float(global_blurred.min())
        vol_max = float(global_blurred.max())

        axial_idx    = nz // 2
        coronal_idx  = ny // 2
        sagittal_idx = nx // 2

        fig_3d = _build_3d(main_mask=global_main_mask)

        # --- Toolbar segmentare ---
        preset_options = [{"label": k, "value": k} for k in HU_PRESETS]

        ui = html.Div(id="fullscreen-target", style={"backgroundColor": BG_COLOR}, children=[
            # 3D
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader(
                            html.Div([
                                "3D RECONSTRUCTION",
                                html.Span(f"  mesh fix: {MAIN_HU_MIN}–{MAIN_HU_MAX} HU", style={
                                    "fontSize": "11px", "color": "#888", "marginLeft": "10px",
                                }),
                            ], style={"fontFamily": "monospace"}),
                        ),
                        dbc.CardBody([
                            dcc.Graph(id="graph-3d", figure=fig_3d, style={"height": "40vh"}),
                        ]),
                    ], color="dark"),
                ], width=12),
            ], className="mb-3"),

            # 2D
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader(html.Span("AXIAL", style={
                            "color": THEME_COLOR, "fontFamily": "monospace", "fontWeight": "bold",
                        })),
                        dbc.CardBody([
                            dcc.Graph(id="graph-axial",
                                      figure=_make_slice_fig(global_img[axial_idx, :, :]),
                                      style={"height": "35vh"},
                                      config={"scrollZoom": True,
                                              "modeBarButtonsToAdd": ["drawclosedpath", "eraseshape"],
                                              "displayModeBar": True}),
                            dcc.Slider(id="slider-axial", min=0, max=nz-1, step=1,
                                       value=axial_idx, marks=None,
                                       tooltip={"placement": "bottom", "always_visible": True}),
                        ]),
                    ], color="dark"),
                ], width=4),

                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader(html.Span("CORONAL", style={
                            "color": "#ffaa00", "fontFamily": "monospace", "fontWeight": "bold",
                        })),
                        dbc.CardBody([
                            dcc.Graph(id="graph-coronal",
                                      figure=_make_slice_fig(global_img[:, coronal_idx, :]),
                                      style={"height": "35vh"},
                                      config={"scrollZoom": True,
                                              "modeBarButtonsToAdd": ["drawclosedpath", "eraseshape"],
                                              "displayModeBar": True}),
                            dcc.Slider(id="slider-coronal", min=0, max=ny-1, step=1,
                                       value=coronal_idx, marks=None,
                                       tooltip={"placement": "bottom", "always_visible": True}),
                        ]),
                    ], color="dark"),
                ], width=4),

                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader(html.Span("SAGITTAL", style={
                            "color": "#ff4400", "fontFamily": "monospace", "fontWeight": "bold",
                        })),
                        dbc.CardBody([
                            dcc.Graph(id="graph-sagittal",
                                      figure=_make_slice_fig(global_img[:, :, sagittal_idx]),
                                      style={"height": "35vh"},
                                      config={"scrollZoom": True,
                                              "modeBarButtonsToAdd": ["drawclosedpath", "eraseshape"],
                                              "displayModeBar": True}),
                            dcc.Slider(id="slider-sagittal", min=0, max=nx-1, step=1,
                                       value=sagittal_idx, marks=None,
                                       tooltip={"placement": "bottom", "always_visible": True}),
                        ]),
                    ], color="dark"),
                ], width=4),
            ]),
        ])

        status = dbc.Alert(
            f"✓  {nz}×{ny}×{nx} voxeli  |  spacing {sz:.2f}×{sy:.2f}×{sx:.2f} mm  "
            f"|  HU range [{vol_min:.0f}, {vol_max:.0f}]  "
            f"|  mesh principal fix: {MAIN_HU_MIN}–{MAIN_HU_MAX} HU",
            color="success", style={"fontFamily": "monospace", "fontSize": "12px"},
        )

        toolbar_style = {"display": "block", "marginBottom": "16px"}
        return status, True, ui, toolbar_style

    except Exception as e:
        import traceback
        return dbc.Alert([
            html.Strong("Eroare: "), str(e), html.Br(),
            html.Pre(traceback.format_exc(), style={"fontSize": "10px"}),
        ], color="danger"), False, None, {"display": "none"}


# ---------------- HU PRESET UI ----------------

@app.callback(
    Output("hu-custom-inputs", "style"),
    Output("hu-range-preview",  "children"),
    Input("hu-preset-dropdown", "value"),
    Input("hu-custom-min",      "value"),
    Input("hu-custom-max",      "value"),
    prevent_initial_call=True,
)
def update_hu_ui(preset, cmin, cmax):
    if preset == "Custom":
        lo, hi = (cmin or -200), (cmax or 200)
        return (
            {"display": "flex", "alignItems": "center"},
            f"range activ: {lo} → {hi} HU",
        )
    lo, hi = HU_PRESETS[preset]
    return (
        {"display": "none"},
        f"range activ: {lo} → {hi} HU",
    )


# ---------------- DRAW MODE — mereu activ pe ambele planuri ----------------
# Butoanele axial/sagittal sunt ascunse; draw mode e permanent activ
# Planul axial are mereu drawclosedpath, la fel sagittal
# Toggle-ul nu mai e necesar, dar callback-ul trebuie sa existe pt Store-uri

@app.callback(
    Output("draw-mode-active",    "data"),
    Output("draw-source",         "data"),
    Output("draw-mode-indicator", "children"),
    Input("btn-draw-axial",    "n_clicks"),
    Input("btn-draw-sagittal", "n_clicks"),
    Input("btn-draw-stop",     "n_clicks"),
    prevent_initial_call=True,
)
def toggle_draw(n_ax, n_sag, n_stop):
    # Butoanele sunt ascunse, dar callback-ul trebuie prezent
    return True, "both", ""


# ---------------- FULLSCREEN clientside ----------------

app.clientside_callback(
    """
    function(n_clicks) {
        if (!n_clicks) return window.dash_clientside.no_update;
        var el = document.getElementById('fullscreen-target');
        if (!el) return window.dash_clientside.no_update;
        if (!document.fullscreenElement) {
            el.requestFullscreen().catch(function(e) { console.log(e); });
        } else {
            document.exitFullscreen();
        }
        return window.dash_clientside.no_update;
    }
    """,
    Output("btn-fullscreen", "n_clicks"),
    Input("btn-fullscreen",  "n_clicks"),
    prevent_initial_call=True,
)


# ---------------- 2D SLICE UPDATES ----------------

@app.callback(
    Output("graph-axial", "figure"),
    Input("slider-axial",       "value"),
    Input("draw-mode-active",   "data"),
    Input("draw-source",        "data"),
    Input("seg-update-counter", "data"),
    prevent_initial_call=True,
)
def upd_axial(idx, draw_active, draw_src, _c):
    if global_img is None: return go.Figure()
    idx = int(idx)
    ov  = global_seg_mask_axial[idx, :, :] if global_seg_mask_axial is not None else None
    if ov is not None and not ov.any(): ov = None
    # draw mode mereu activ pe axial
    return _make_slice_fig(global_img[idx, :, :], draw_mode=True, seg_overlay=ov)


@app.callback(
    Output("graph-sagittal", "figure"),
    Input("slider-sagittal",    "value"),
    Input("draw-mode-active",   "data"),
    Input("draw-source",        "data"),
    Input("seg-update-counter", "data"),
    prevent_initial_call=True,
)
def upd_sagittal(idx, draw_active, draw_src, _c):
    if global_img is None: return go.Figure()
    idx = int(idx)
    ov  = global_seg_mask_sagittal[:, :, idx] if global_seg_mask_sagittal is not None else None
    if ov is not None and not ov.any(): ov = None
    # draw mode mereu activ pe sagittal
    return _make_slice_fig(global_img[:, :, idx], draw_mode=True, seg_overlay=ov)


@app.callback(
    Output("graph-coronal", "figure"),
    Input("slider-coronal",     "value"),
    Input("seg-update-counter", "data"),
    prevent_initial_call=True,
)
def upd_coronal(idx, _c):
    if global_img is None: return go.Figure()
    idx = int(idx)
    ov  = global_seg_mask_coronal[:, idx, :] if global_seg_mask_coronal is not None else None
    if ov is not None and not ov.any(): ov = None
    # draw mode mereu activ pe coronal
    return _make_slice_fig(global_img[:, idx, :], draw_mode=True, seg_overlay=ov)


# ---------------- SEGMENTARE: desen axial ----------------

@app.callback(
    Output("axial-region-status",  "children"),
    Output("axial-region-status",  "style"),
    Output("seg-update-counter",   "data"),
    Input("graph-axial",           "relayoutData"),
    Input("btn-seg-reset",         "n_clicks"),
    State("hu-preset-dropdown",    "value"),
    State("hu-custom-min",         "value"),
    State("hu-custom-max",         "value"),
    State("seg-update-counter",    "data"),
    prevent_initial_call=True,
)
def seg_axial(axial_relay, reset_clicks, hu_preset, hu_cmin, hu_cmax, counter):
    global global_seg_mask_axial, global_seg_mask_sagittal, global_blurred, global_img

    if global_img is None:
        return dash.no_update, dash.no_update, dash.no_update

    nz, ny, nx = global_img.shape
    tid = ctx.triggered_id
    base_style = {"fontFamily": "monospace", "fontSize": "11px",
                  "border": "1px solid #333", "borderRadius": "4px", "padding": "2px 8px"}

    if tid == "btn-seg-reset":
        global_seg_mask_axial = np.zeros((nz, ny, nx), dtype=bool)
        return "[ AXIAL: gol ]", {**base_style, "color": "#555"}, (counter or 0) + 1

    path_str = _extract_path(axial_relay)
    if not path_str:
        return dash.no_update, dash.no_update, dash.no_update

    geom_mask = _parse_path_to_mask(path_str, (ny, nx))
    if geom_mask is None:
        return dash.no_update, dash.no_update, dash.no_update

    hu_lo, hu_hi = _get_hu_range(hu_preset, hu_cmin, hu_cmax)
    hu_vol   = (global_blurred >= hu_lo) & (global_blurred <= hu_hi)
    extruded = geom_mask[np.newaxis, :, :] & hu_vol

    if global_seg_mask_axial is None:
        global_seg_mask_axial = np.zeros((nz, ny, nx), dtype=bool)
    global_seg_mask_axial |= extruded

    vox = int(global_seg_mask_axial.sum())
    return (f"[ AXIAL: {vox:,} vox ]",
            {**base_style, "color": THEME_COLOR, "borderColor": THEME_COLOR},
            (counter or 0) + 1)


# ---------------- SEGMENTARE: desen sagittal ----------------

@app.callback(
    Output("sagittal-region-status", "children"),
    Output("sagittal-region-status", "style"),
    Input("graph-sagittal",          "relayoutData"),
    Input("btn-seg-reset",           "n_clicks"),
    State("hu-preset-dropdown",      "value"),
    State("hu-custom-min",           "value"),
    State("hu-custom-max",           "value"),
    prevent_initial_call=True,
)
def seg_sagittal(sag_relay, reset_clicks, hu_preset, hu_cmin, hu_cmax):
    global global_seg_mask_sagittal, global_blurred, global_img

    if global_img is None:
        return dash.no_update, dash.no_update

    nz, ny, nx = global_img.shape
    tid = ctx.triggered_id
    base_style = {"fontFamily": "monospace", "fontSize": "11px",
                  "border": "1px solid #333", "borderRadius": "4px", "padding": "2px 8px"}

    if tid == "btn-seg-reset":
        global_seg_mask_sagittal = np.zeros((nz, ny, nx), dtype=bool)
        return "[ SAGITTAL: gol ]", {**base_style, "color": "#555"}

    path_str = _extract_path(sag_relay)
    if not path_str:
        return dash.no_update, dash.no_update

    geom_mask = _parse_path_to_mask(path_str, (nz, ny))
    if geom_mask is None:
        return dash.no_update, dash.no_update

    hu_lo, hu_hi = _get_hu_range(hu_preset, hu_cmin, hu_cmax)
    hu_vol   = (global_blurred >= hu_lo) & (global_blurred <= hu_hi)
    extruded = geom_mask[:, :, np.newaxis] & hu_vol

    if global_seg_mask_sagittal is None:
        global_seg_mask_sagittal = np.zeros((nz, ny, nx), dtype=bool)
    global_seg_mask_sagittal |= extruded

    vox = int(global_seg_mask_sagittal.sum())
    return (f"[ SAGITTAL: {vox:,} vox ]",
            {**base_style, "color": "#ff4400", "borderColor": "#ff4400"})


# ---------------- SEGMENTARE: desen coronal ----------------

@app.callback(
    Output("coronal-region-status", "children"),
    Output("coronal-region-status", "style"),
    Input("graph-coronal",          "relayoutData"),
    Input("btn-seg-reset",          "n_clicks"),
    State("slider-coronal",         "value"),
    State("hu-preset-dropdown",     "value"),
    State("hu-custom-min",          "value"),
    State("hu-custom-max",          "value"),
    prevent_initial_call=True,
)
def seg_coronal(cor_relay, reset_clicks, coronal_idx, hu_preset, hu_cmin, hu_cmax):
    global global_seg_mask_coronal, global_blurred, global_img

    if global_img is None:
        return dash.no_update, dash.no_update

    nz, ny, nx = global_img.shape
    tid = ctx.triggered_id
    base_style = {"fontFamily": "monospace", "fontSize": "11px",
                  "border": "1px solid #333", "borderRadius": "4px", "padding": "2px 8px"}

    if tid == "btn-seg-reset":
        global_seg_mask_coronal = np.zeros((nz, ny, nx), dtype=bool)
        return "[ CORONAL: gol ]", {**base_style, "color": "#555"}

    path_str = _extract_path(cor_relay)
    if not path_str:
        return dash.no_update, dash.no_update

    # Coronal: plan (nz, nx) — extrudare pe axa Y
    geom_mask = _parse_path_to_mask(path_str, (nz, nx))
    if geom_mask is None:
        return dash.no_update, dash.no_update

    hu_lo, hu_hi = _get_hu_range(hu_preset, hu_cmin, hu_cmax)
    hu_vol   = (global_blurred >= hu_lo) & (global_blurred <= hu_hi)
    # geom_mask: (nz, nx) -> (nz, 1, nx) broadcastat cu (nz, ny, nx)
    extruded = geom_mask[:, np.newaxis, :] & hu_vol

    if global_seg_mask_coronal is None:
        global_seg_mask_coronal = np.zeros((nz, ny, nx), dtype=bool)
    global_seg_mask_coronal |= extruded

    vox = int(global_seg_mask_coronal.sum())
    return (f"[ CORONAL: {vox:,} vox ]",
            {**base_style, "color": "#ffaa00", "borderColor": "#ffaa00"})


# ---------------- GENERARE MESH (buton) ----------------

@app.callback(
    Output("graph-3d",     "figure"),
    Input("btn-generate-mesh", "n_clicks"),
    Input("btn-seg-reset",     "n_clicks"),
    prevent_initial_call=True,
)
def generate_mesh(n_gen, n_reset):
    global global_seg_mask

    if global_img is None:
        return dash.no_update

    nz, ny, nx = global_img.shape
    tid = ctx.triggered_id

    if tid == "btn-seg-reset":
        global_seg_mask = np.zeros((nz, ny, nx), dtype=bool)
        return _build_3d(main_mask=global_main_mask, seg_mask=None)

    ax  = global_seg_mask_axial    if (global_seg_mask_axial    is not None and global_seg_mask_axial.any())    else None
    sag = global_seg_mask_sagittal if (global_seg_mask_sagittal is not None and global_seg_mask_sagittal.any()) else None
    cor = global_seg_mask_coronal  if (global_seg_mask_coronal  is not None and global_seg_mask_coronal.any())  else None

    # Colectam mastile disponibile
    available = [m for m in [ax, sag, cor] if m is not None]

    if not available:
        global_seg_mask = np.zeros((nz, ny, nx), dtype=bool)
    elif len(available) == 1:
        global_seg_mask = available[0].copy()
    else:
        # Intersectie progresiva: cu cat mai multe planuri, cu atat mai precis
        result = available[0].copy()
        for m in available[1:]:
            result &= m
        global_seg_mask = result

    return _build_3d(main_mask=global_main_mask, seg_mask=global_seg_mask)


# ---------------- HELPER HU RANGE ----------------

def _get_hu_range(preset, cmin, cmax):
    if preset == "Custom":
        return float(cmin or -200), float(cmax or 200)
    return HU_PRESETS.get(preset, (-950, -300))


# ---------------- RUN ----------------

if __name__ == "__main__":
    app.run(debug=True, port=8050)