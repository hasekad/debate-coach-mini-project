# Debate Coach Mini Project

This project is a lightweight AI Debate Coach app.

Users:
- choose a debate topic,
- pick a side (for/against),
- enter their argument,
- and receive AI-generated feedback:
  - a counterargument,
  - strengths,
  - weaknesses,
  - suggestions for improvement.

The backend uses the Together API (via `TOGETHER_API_KEY`) and the frontend is a simple static web app.

## Project Structure

- `backend/` - FastAPI service that calls Together API
- `frontend/` - HTML/CSS/JS UI

## Prerequisites

- Python 3.10+ (3.11 recommended)
- A valid Together API key

## Setup

1. Install backend dependencies:

```bash
cd backend
python3 -m pip install -r requirements.txt
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Open `backend/.env` and set your key:

```env
TOGETHER_API_KEY=your_together_api_key_here
```

Optional speed tuning:

```env
TOGETHER_MODEL=Qwen/Qwen2.5-7B-Instruct-Turbo
TOGETHER_MAX_TOKENS=220
TOGETHER_TEMPERATURE=0.2
```

- Lower `TOGETHER_MAX_TOKENS` for faster responses.
- Use a faster Together model in `TOGETHER_MODEL` if desired.

## How To Run

From the project root, run backend:

```bash
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8001
```

In a second terminal, run frontend:

```bash
python3 -m http.server 5501 --directory frontend
```

Open in browser:

- `http://127.0.0.1:5501`

## Working Prompt Examples

These are the prompts that currently work reliably:

1. Topic: Remote work is better than office work  
   Side: For  
   Argument: Remote work saves time on commuting and improves work-life balance.

2. Topic: Social media does more harm than good  
   Side: For  
   Argument: Social media increases anxiety and reduces real-life interaction between people.

3. Topic: Fast food should be regulated  
   Side: For  
   Argument: Fast food contributes to health problems like obesity and should be controlled.

4. Topic: Homework should be limited  
   Side: For  
   Argument: Too much homework causes stress and reduces time for other important activities.