import dash
import dash_bootstrap_components as dbc
from dash import dcc, html
from dash.dependencies import Input, Output, State
import plotly.graph_objects as go
import numpy as np
import nibabel as nib
from skimage import measure, filters
from scipy import ndimage
from dash_slicer import VolumeSlicer
import base64
import tempfile
import os

# ---------------- CONFIG ----------------

external_stylesheets = [dbc.themes.DARKLY]

app = dash.Dash(
    __name__,
    external_stylesheets=external_stylesheets,
    suppress_callback_exceptions=True
)

server = app.server

THEME_COLOR = "#2da1ad"
BG_COLOR = "#000000"

# ---------------- GLOBAL STATE ----------------
global_img = None
global_blurred = None
global_spacing = None

slicer_axial = None
slicer_sagittal = None

# ---------------- LAYOUT INITIAL ----------------

app.layout = html.Div(
    style={
        "backgroundColor": BG_COLOR,
        "color": "#fff",
        "minHeight": "100vh",
        "padding": "20px",
    },
    children=[
        dcc.Upload(
            id="upload-data",
            children=html.Div(["Trage sau ", html.A("Selectează fișier NIfTI")]),
            style={
                "width": "100%",
                "height": "60px",
                "lineHeight": "60px",
                "borderWidth": "1px",
                "borderStyle": "dashed",
                "borderRadius": "20px",
                "textAlign": "center",
                "borderColor": THEME_COLOR,
                "backgroundColor": "rgba(45,161,173,0.05)",
            },
            multiple=False,
        ),
        html.Div(id="main-content-area"),
        dcc.Store(id="initial-mesh-store"),
        dcc.Store(id="occlusion-surface"),
    ],
)

# ---------------- UPLOAD + INIT ----------------

@app.callback(
    Output("main-content-area", "children"),
    Input("upload-data", "contents"),
    prevent_initial_call=True,
)
def process_upload(contents):

    global global_img, global_blurred, global_spacing
    global slicer_axial, slicer_sagittal

    if contents is None:
        return dash.no_update

    try:
        content_type, content_string = contents.split(",")
        decoded = base64.b64decode(content_string)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".nii.gz") as tf:
            tf.write(decoded)
            temp_path = tf.name

        try:
            img_data = nib.load(temp_path)
            img = img_data.get_fdata()
            affine = img_data.affine
        finally:
            os.remove(temp_path)


        img = np.transpose(img, (2, 1, 0))

        # spacing corect
        global_spacing = (
            abs(affine[0, 0]),
            abs(affine[1, 1]),
            abs(affine[2, 2]),
        )

        global_img = img

        # filtrare pentru marching cubes
        med_img = filters.median(img)
        global_blurred = filters.gaussian(med_img, sigma=0.8)

        # ---------------- SLICERS ----------------

        slicer_axial = VolumeSlicer(
            app, img, axis=2, spacing=global_spacing, thumbnail=False
        )
        slicer_axial.graph.figure.update_layout(
            dragmode="drawclosedpath",
            newshape_line_color=THEME_COLOR,
        )

        slicer_sagittal = VolumeSlicer(
            app, img, axis=0, spacing=global_spacing, thumbnail=False
        )
        slicer_sagittal.graph.figure.update_layout(
            dragmode="drawclosedpath",
            newshape_line_color="#ff4400",
        )

        # ---------------- INITIAL MESH ----------------

        verts, faces, _, _ = measure.marching_cubes(
            global_blurred, 250, step_size=2
        )

        fig_mesh = go.Figure(
            data=[
                go.Mesh3d(
                    x=verts[:, 2],
                    y=verts[:, 1],
                    z=verts[:, 0],
                    i=faces[:, 0],
                    j=faces[:, 1],
                    k=faces[:, 2],
                    opacity=0.15,
                    color=THEME_COLOR,
                )
            ]
        )

        fig_mesh.update_layout(
            template="plotly_dark",
        paper_bgcolor="#000000",  # Fundal exterior
        plot_bgcolor="#000000",   # Fundal grafic
        margin=dict(l=0, r=0, b=0, t=0),
        scene=dict(
        aspectmode="data",
        xaxis=dict(backgroundcolor="#000000", gridcolor="#333"),
        yaxis=dict(backgroundcolor="#000000", gridcolor="#333"),
        zaxis=dict(backgroundcolor="#000000", gridcolor="#333"),
        bgcolor="#000000" # Fundalul interior al cubului 3D
    ),
        )

        # ---------------- RETURN UI ----------------

        return html.Div(
            [
                dbc.Row(
                    [
                        dbc.Col(
                            [
                                dbc.Card(
                                    [
                                        dbc.CardHeader(
                                            "3D RECONSTRUCTION (MARCHING CUBES)"
                                        ),
                                        dbc.CardBody(
                                            [
                                                dcc.Graph(
                                                    id="graph-helper",
                                                    figure=fig_mesh,
                                                    style={"height": "45vh"},
                                                ),
                                                html.Div(
                                                    [
                                                        # Am eliminat mesh-threshold-slider de aici
                                                        html.Label(
                                                            "Segmentation Range (HU):",
                                                            className="mt-3",
                                                        ),
                                                        dcc.RangeSlider(
                                                            id="threshold-slider",
                                                            min=-1000,
                                                            max=1000,
                                                            step=20,
                                                            value=[-1000, -300],
                                                        ),
                                                    ],
                                                    style={"padding": "10px"},
                                                ),
                                            ]
                                        ),
                                    ],
                                    color="dark",
                                )
                            ],
                            width=12,
                        )
                    ],
                    className="mb-4",
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            [
                                html.H6("AXIAL"),
                                slicer_axial.graph,
                                slicer_axial.slider,
                                *slicer_axial.stores,
                            ],
                            width=6,
                        ),
                        dbc.Col(
                            [
                                html.H6("SAGITTAL"),
                                slicer_sagittal.graph,
                                slicer_sagittal.slider,
                                *slicer_sagittal.stores,
                            ],
                            width=6,
                        ),
                    ]
                ),
            ]
        )

    except Exception as e:
        return dbc.Alert(f"Eroare la procesare NIfTI: {str(e)}", color="danger")


# ---------------- UPDATE MESH (HU RANGE FUNCTIONAL) ----------------

@app.callback(
    Output("initial-mesh-store", "data"),
    [
        Input("threshold-slider", "value"),
    ],
    prevent_initial_call=True,
)
def update_initial_mesh(range_threshold):

    v_min, v_max = range_threshold

    mask = (global_blurred >= v_min) & (global_blurred <= v_max)

    verts, faces, _, _ = measure.marching_cubes(
        mask.astype(np.uint8),
        level=0.5,
        step_size=3,
    )

    return go.Mesh3d(
        x=verts[:, 2],
        y=verts[:, 1],
        z=verts[:, 0],
        i=faces[:, 0],
        j=faces[:, 1],
        k=faces[:, 2],
        opacity=0.3,
        color=THEME_COLOR,
    )


# ---------------- CLIENTSIDE FAST REFRESH ----------------

app.clientside_callback(
    """
    function(mesh, surf, fig){
        if(!fig) return window.dash_clientside.no_update;
        let newFig = JSON.parse(JSON.stringify(fig));
        if(mesh) newFig.data[0] = mesh;
        if(surf) newFig.data[1] = surf;
        newFig.layout.uirevision = true;
        return newFig;
    }
    """,
    Output("graph-helper", "figure"),
    [Input("initial-mesh-store", "data"),
     Input("occlusion-surface", "data")],
    State("graph-helper", "figure"),
)

# ---------------- RUN ----------------

if __name__ == "__main__":
    app.run(debug=True, port=8050)