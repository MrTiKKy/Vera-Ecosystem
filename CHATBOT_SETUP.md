# Vera Chatbot Setup Guide

This guide explains how to set up the Gemini AI chatbot integration with the Vera Ecosystem.

## Prerequisites

1. **Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key and save it securely

2. **Python Packages**
   ```bash
   pip install google-generativeai
   ```

## Configuration

### Backend Setup

#### Option 1: Environment Variable (Recommended)

Set the `GEMINI_API_KEY` environment variable before running the backend:

**Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY = "your-api-key-here"
python main.py
```

**Windows (Command Prompt):**
```cmd
set GEMINI_API_KEY=your-api-key-here
python main.py
```

**Linux/Mac:**
```bash
export GEMINI_API_KEY="your-api-key-here"
python main.py
```

#### Option 2: Create .env File

Create a `.env` file in the `backend` folder:
```
GEMINI_API_KEY=your-api-key-here
```

Then install `python-dotenv` and load it:
```bash
pip install python-dotenv
```

Add to `main.py` (after imports):
```python
from dotenv import load_dotenv
load_dotenv()
```

### Frontend Setup

The frontend is pre-configured to communicate with the backend. No additional setup is needed.

The chatbot endpoint is: `http://localhost:8050/api/chat`

## Running the Application

### Start Backend
```bash
cd backend
python main.py
```
The backend will run on `http://localhost:8050`

### Start Frontend
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173` (or another port if configured)

## Features

### Chat Interface
- **File Upload**: Drop medical scans (DICOM/NIFTI) for AI analysis
- **Interactive Chat**: Ask questions about the scans
- **Context-Aware**: AI maintains conversation history per session
- **Real-time Responses**: Powered by Gemini Pro model

### API Endpoints

#### POST `/api/chat`
Send a chat message to the AI assistant.

**Request:**
```json
{
  "message": "What organs are visible in this scan?",
  "session_id": "session_123",
  "context": "Uploaded scan: chest_ct.nii.gz (5MB)"
}
```

**Response:**
```json
{
  "success": true,
  "response": "The scan shows the lungs, heart, and thoracic structures...",
  "role": "vera"
}
```

#### POST `/api/analyze-scan`
Analyze an uploaded medical scan.

**Request:**
```json
{
  "filename": "chest_ct.nii.gz",
  "filesize": 5242880,
  "session_id": "session_123"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Initial analysis: This appears to be a chest CT...",
  "context": "Uploaded scan: chest_ct.nii.gz (5MB)"
}
```

## Troubleshooting

### Error: "Gemini API not configured"
- Check that `GEMINI_API_KEY` environment variable is set
- Verify the API key is valid and active
- Restart the backend after setting the environment variable

### Connection Error
- Ensure backend is running on `http://localhost:8050`
- Check that ports 5173 (frontend) and 8050 (backend) are not blocked
- Verify CORS is enabled (it should be by default in Dash)

### Empty Responses
- Check API key quota and usage limits
- Ensure the Gemini API is active in Google Cloud Console
- Check backend logs for detailed error messages

## API Key Security

⚠️ **Important Security Notes:**
- Never commit API keys to version control
- Use environment variables in production
- Rotate API keys regularly
- Monitor API usage for unauthorized access
- Use separate API keys for development and production

## Advanced Configuration

### Customize System Prompt

Edit the `get_vera_response` function in `main.py` to modify the AI behavior:

```python
system_prompt = """You are VERA, a specialized medical AI assistant for the Vera Ecosystem.
Your role is to:
- [Customize instructions here]
"""
```

### Adjust Model Parameters

Modify the chat message handling to adjust model parameters:

```python
response = chat.send_message(
    system_prompt,
    stream=False,  # Set to True for streaming responses
    temperature=0.7,  # Adjust creativity (0.0-1.0)
    top_k=40,
    top_p=0.95
)
```

## Support

For issues or questions:
1. Check the logs in both frontend and backend
2. Verify API key configuration
3. Ensure all dependencies are installed
4. Review the [Google AI Python SDK documentation](https://github.com/google/generative-ai-python)

---

**Current Date**: March 17, 2026
**Integration Status**: ✓ Complete and Functional
