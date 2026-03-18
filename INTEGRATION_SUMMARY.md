# Chatbot Integration Summary

## Overview
The Vera Chatbot integrates Google's Gemini AI with the medical imaging analysis platform. The chatbot provides medical insights, analyzes uploaded scans, and maintains conversation context.

---

## Backend Implementation

### Location: `backend/main.py`

#### 1. **Imports** (Lines 12-15)
```python
import json
from flask import request, jsonify
import google.generativeai as genai
```
Added Flask and Gemini API imports for handling chatbot requests.

#### 2. **Gemini Configuration** (Lines ~777-790)
```python
# Initialize Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    MODEL = genai.GenerativeModel("gemini-pro")
else:
    MODEL = None

# Store conversation history per session
chat_sessions = {}
```
Configures the Gemini API and manages session-specific chat history.

#### 3. **Core Functions** (Lines ~792-820)

**`get_or_create_chat(session_id)`**
- Creates or retrieves a chat session per user
- Maintains conversation context across messages

**`get_vera_response(user_message, session_id, context=None)`**
- Sends user messages to Gemini AI
- Builds context-aware prompts for medical analysis
- Returns AI responses

#### 4. **API Endpoints** (Lines ~823-890)

**`POST /api/chat`**
- Receives chat messages from frontend
- Parameters: `message`, `session_id`, `context`
- Returns AI response in JSON format

**`POST /api/analyze-scan`**
- Analyzes uploaded medical scans
- Parameters: `filename`, `filesize`, `session_id`
- Provides initial assessment and context

---

## Frontend Implementation

### Location: `frontend/src/pages/Atlas3D.jsx`

#### 1. **State Management** (Lines 11-17)
```javascript
const [chatInput, setChatInput] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
const [scanContext, setScanContext] = useState(null);
const chatEndRef = useRef(null);
```
New state variables for chat functionality and session management.

#### 2. **API Integration Functions** (Lines ~62-125)

**`sendChatMessage(message)`**
- Sends user messages to backend `/api/chat` endpoint
- Updates chat history with responses
- Handles loading states and errors

**`analyzeScan(filename, filesize)`**
- Sends uploaded scan metadata to backend
- Gets initial AI analysis
- Sets scan context for subsequent queries

**`handleChatKeyPress(e)`**
- Allows Enter key to send messages
- Prevents Shift+Enter from triggering send

#### 3. **UI Components** (Lines ~220-235)
- Chat message display area with auto-scroll
- Input field with real-time state binding
- Loading state handling

#### 4. **Updated Handlers** (Lines ~185-192)
- `handleDrop()` now calls `analyzeScan()` instead of simulation

---

## Data Flow

### Chat Message Flow
```
Frontend (Atlas3D.jsx)
  └─> sendChatMessage()
    └─> POST /api/chat
      └─> Backend (main.py)
        └─> get_vera_response()
          └─> Gemini API
            └─> Response
          └─> Return JSON
        └─> Frontend receives response
          └─> Update chatHistory state
            └─> Display in UI
```

### File Analysis Flow
```
Frontend (Atlas3D.jsx)
  └─> handleDrop(file)
    └─> analyzeScan(filename, filesize)
      └─> POST /api/analyze-scan
        └─> Backend (main.py)
          └─> Gemini API analysis
            └─> Response
          └─> Frontend receives response
            └─> Update chatHistory with analysis
              └─> Display in UI
```

---

## Configuration

### Backend Setup
1. Install Gemini dependency:
   ```bash
   pip install -r req.txt
   ```

2. Set API key (choose one method):
   - Environment variable:
     ```bash
     set GEMINI_API_KEY=your-key
     python main.py
     ```
   - Or create `.env` file with:
     ```
     GEMINI_API_KEY=your-key
     ```

3. Run backend:
   ```bash
   python main.py
   ```
   Backend runs on `http://localhost:8050`

### Frontend Setup
Frontend requires no additional configuration. It targets the backend at `http://localhost:8050`.

---

## API Key Locations

### Where to Get API Key
1. Visit: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the generated key

### Where to Store API Key
- **Development**: `.env` file in backend folder
- **Production**: Environment variables (recommended)
- **Never**: Commit to version control

---

## Security Considerations

✓ **Implemented:**
- API key loaded from environment variables (not hardcoded)
- Session-based chat management (per user)
- Error handling without exposing sensitive information
- Context filtering for medical data

⚠️ **Best Practices:**
- Rotate API keys regularly
- Monitor API usage for anomalies
- Use separate keys for dev/prod
- Implement rate limiting (optional)
- Add authentication for production

---

## Testing

### Test Backend Chatbot
```bash
curl -X POST http://localhost:8050/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is a CT scan?",
    "session_id": "test_session",
    "context": "Medical imaging training"
  }'
```

### Test Scan Analysis
```bash
curl -X POST http://localhost:8050/api/analyze-scan \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "chest_ct.nii.gz",
    "filesize": 5242880,
    "session_id": "test_session"
  }'
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API not configured" | Set GEMINI_API_KEY environment variable |
| Connection refused | Verify backend running on port 8050 |
| Empty responses | Check API key quota and permissions |
| CORS errors | Verify Flask routes are accessible |

---

## Files Modified

- `backend/main.py` - Added Gemini integration and Flask endpoints
- `frontend/src/pages/Atlas3D.jsx` - Added chat UI logic and API calls
- `backend/req.txt` - Added google-generativeai dependency

---

## Files Created

- `CHATBOT_SETUP.md` - Detailed setup guide
- `backend/.env.example` - Example environment configuration
- `INTEGRATION_SUMMARY.md` - This document

---

**Integration Date**: March 17, 2026
**Status**: ✓ Complete and Functional
