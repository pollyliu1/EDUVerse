from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
from groq import Groq
import io

load_dotenv('../.env')

app = FastAPI()

openai_client = openai.OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),  
)

groq_client = openai.OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)


# Define a Pydantic model for the request body
class ChatRequest(BaseModel):
    llm: str = "openai"
    prompt: str
    max_tokens: int = None
    temperature: float = None
    top_p: float = None

def send_message(prompt: str, llm: str, max_tokens: int = None, temperature: float = None, top_p: float = None):
    request_payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ]
    }
    if max_tokens is not None:
        request_payload["max_tokens"] = max_tokens
    if temperature is not None:
        request_payload["temperature"] = temperature
    if top_p is not None:
        request_payload["top_p"] = top_p
    if llm == "openai":
        return openai_client.chat.completions.create(**request_payload)
    elif llm == "groq":
        request_payload["model"] = "llama-3.3-70b-versatile"
        return groq_client.chat.completions.create(**request_payload)
    else:
        raise HTTPException(status_code=400, detail="Invalid LLM")

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = send_message(request.prompt, request.llm, request.max_tokens, request.temperature, request.top_p)
        print(response.choices[0].message.content)
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), provider: str = "groq"):
    try:
        # Read the uploaded file
        audio_bytes = await file.read()
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = file.filename  # Whisper requires the file to have a name attribute

        # Transcribe audio using OpenAI's Whisper
        if provider == "groq":

            transcript = groq_client.audio.transcriptions.create(
                model="whisper-large-v3-turbo",
                file=(audio_file.name, audio_file),
                response_format="json",
                language="en"
            )
            return {"transcript": transcript.text}
        else:
            transcript = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
            )
            return {"transcript": transcript["text"].strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))