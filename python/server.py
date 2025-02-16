from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from PIL import Image, File, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
# from groq import Groq
import io
from elevenlabs.client import ElevenLabs
from elevenlabs import play, stream
from groq import Groq
import io
import base64
import json

load_dotenv('../.env')

app = FastAPI()

openai_client = openai.OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),  
)

groq_client = openai.OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

eleven_labs_client = ElevenLabs(
    api_key=os.environ.get("ELEVENLABS_API_KEY"),
)

class ChatRequest(BaseModel):
    llm: str = "openai"
    prompt: str
    max_tokens: int = None
    temperature: float = None
    top_p: float = None

class GenerateSpeechRequest(BaseModel):
    input: str
    stream: bool = True
    voice_id: str = "qDazFCguyJ6M5CH0mFuN" # 3blue1brown

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
        audio_bytes = await file.read()
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = file.filename  

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
    

@app.post("/generate_speech")
async def generate_speech(request: GenerateSpeechRequest):
    if not request.stream: # currently only supports streaming
        response = eleven_labs_client.text_to_speech.convert(
            text=request.input,
            # grant's voice (3blue1brown)
            voice_id=request.voice_id,
            # voice_id="JBFqnCBsd6RMkjVDRZzb",
            # model_id="eleven_multilingual_v2",
            model_id="eleven_turbo_v2_5",
                output_format="mp3_44100_128",
        )

        audio_data = io.BytesIO()
        for chunk in response:
            audio_data.write(chunk)        
        audio_data.seek(0)
        audio_data.name = "output.mp3"
        return StreamingResponse(audio_data, media_type="audio/mpeg", headers={"Content-Disposition": "attachment; filename=output.mp3"})
    else:
        audio_stream = eleven_labs_client.text_to_speech.convert_as_stream(
            text=request.input,
            voice_id=request.voice_id,
            model_id="eleven_turbo_v2_5",
            output_format="mp3_44100_128",
        )

        for chunk in audio_stream:
            if isinstance(chunk, bytes):
                print(chunk)
        return StreamingResponse(audio_stream, media_type="audio/mpeg") 



