import os
import json
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from together import Together

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allows all (fine for your project)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("TOGETHER_API_KEY")
client = Together(api_key=api_key) if api_key else None

MODEL_NAME = os.getenv("TOGETHER_MODEL", "Qwen/Qwen2.5-7B-Instruct-Turbo")
MAX_TOKENS = int(os.getenv("TOGETHER_MAX_TOKENS", "220"))
TEMPERATURE = float(os.getenv("TOGETHER_TEMPERATURE", "0.2"))

class DebateRequest(BaseModel):
    topic: str
    side: str
    argument: str

class DebateResponse(BaseModel):
    counterargument: str = Field(description="A strong counterargument to the user's position")
    strengths: str = Field(description="What is good about the user's argument")
    weaknesses: str = Field(description="What is weak or missing in the user's argument")
    suggestions: str = Field(description="How the user can improve the argument")


def _extract_json_object(raw_text: str) -> str:
    """Extract a JSON object from model output, including fenced blocks."""
    if not raw_text:
        raise ValueError("Empty model response.")

    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").strip()
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON object found in model response.")

    return cleaned[start : end + 1]


def _parse_debate_response(raw_text: str) -> dict[str, Any]:
    json_text = _extract_json_object(raw_text)
    parsed = json.loads(json_text)
    validated = DebateResponse.model_validate(parsed)
    return validated.model_dump()


def _create_messages(data: DebateRequest) -> list[dict[str, str]]:
    return [
        {
            "role": "system",
            "content": (
                "You are an AI debate coach. "
                "Keep each field concise and actionable (1-2 short sentences). "
                f"Only answer in JSON and follow this schema: {json.dumps(DebateResponse.model_json_schema())}"
            ),
        },
        {
            "role": "user",
            "content": (
                f"Topic: {data.topic}\n"
                f"Side: {data.side}\n"
                f"Argument: {data.argument}\n\n"
                "Provide a strong counterargument, strengths, weaknesses, and suggestions."
            ),
        },
    ]

@app.get("/")
def read_root():
    return {"message": "Debate Coach API is running"}

@app.post("/debate-coach")
def debate_coach(data: DebateRequest):
    if not api_key or not client:
        raise HTTPException(
            status_code=500,
            detail="TOGETHER_API_KEY is missing. Add it to backend/.env and restart the server.",
        )

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=_create_messages(data),
            max_tokens=MAX_TOKENS,
            temperature=TEMPERATURE,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "debate_response",
                    "schema": DebateResponse.model_json_schema(),
                },
            },
        )

        content = response.choices[0].message.content
        if not content:
            fallback_response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=_create_messages(data),
                max_tokens=MAX_TOKENS,
                temperature=TEMPERATURE,
            )
            content = fallback_response.choices[0].message.content

        return _parse_debate_response(content)

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Model returned malformed JSON: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Model output could not be parsed: {str(e)}",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
