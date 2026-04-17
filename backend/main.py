from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from together import Together
import os
import json

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
if not api_key:
    raise ValueError("TOGETHER_API_KEY not found in .env file")

client = Together(api_key=api_key)

class DebateRequest(BaseModel):
    topic: str
    side: str
    argument: str

class DebateResponse(BaseModel):
    counterargument: str = Field(description="A strong counterargument to the user's position")
    strengths: str = Field(description="What is good about the user's argument")
    weaknesses: str = Field(description="What is weak or missing in the user's argument")
    suggestions: str = Field(description="How the user can improve the argument")

@app.get("/")
def read_root():
    return {"message": "Debate Coach API is running"}

@app.post("/debate-coach")
def debate_coach(data: DebateRequest):
    try:
        response = client.chat.completions.create(
            model="Qwen/Qwen3.5-9B",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an AI debate coach. "
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
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "debate_response",
                    "schema": DebateResponse.model_json_schema(),
                },
            },
        )

        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
