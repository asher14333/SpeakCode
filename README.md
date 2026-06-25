# SpeakCode

Voice-first AI coding interview coach. Practice explaining LeetCode solutions out loud and get feedback on your communication — not just your code.

## How it works

1. Read the **Two Sum** problem
2. Click **Start Explanation** and speak your approach
3. Review the transcript (edit if needed)
4. Click **Analyze** to get AI interview feedback

## Prerequisites

- Node.js 18+
- Python 3.10+
- OpenAI API key
- Chrome or Edge (for Web Speech API)

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add your OPENAI_API_KEY to .env
python app.py
```

Backend runs at `http://127.0.0.1:5001`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. API requests are proxied to the backend automatically (avoids macOS port 5000 / AirPlay conflicts).

> **Note:** macOS uses port 5000 for AirPlay Receiver. The backend uses port **5001** to avoid this.

## API

**POST /analyze**

```json
{
  "transcript": "I would use a hashmap to store seen values..."
}
```

Response:

```json
{
  "score": 8,
  "strengths": ["Explained brute force approach", "Mentioned time complexity"],
  "improvements": ["Discuss space complexity", "Walk through an example"]
}
```

## Tech stack

- **Frontend:** React, Vite, Web Speech API, Axios
- **Backend:** Flask, OpenAI API
- **AI:** GPT-4o-mini with structured JSON output
