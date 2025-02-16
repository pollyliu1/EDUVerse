from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
from groq import Groq
import base64
import io
from elevenlabs.client import ElevenLabs
from elevenlabs import play, stream

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

class ImageRequest(BaseModel):
    prompt: str = "Describe the content of this image."
    max_tokens: int | None = None
    temperature: float | None = None
    top_p: float | None = None


# -------------------------------------- Chat --------------------------------------
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
    

# -------------------------------------- Speech --------------------------------------
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


# -------------------------------------- Image --------------------------------------
def send_image_message(image_data: bytes, request: ImageRequest):
    # Encode image to base64
    image_base64 = base64.b64encode(image_data).decode("utf-8")
    
    request_payload = {
        "model": "gpt-4o",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": request.prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        }
                    }
                ]
            }
        ],
    }
    
    if request.max_tokens is not None:
        request_payload["max_tokens"] = request.max_tokens
    if request.temperature is not None:
        request_payload["temperature"] = request.temperature
    if request.top_p is not None:
        request_payload["top_p"] = request.top_p
        
    return openai_client.chat.completions.create(**request_payload)

@app.post("/image-to-text")
async def image_to_text(
    file: UploadFile = File(...),
    prompt: str = Form(default="Describe the content of this image."),
    max_tokens: int = None,
    temperature: float = None,
    top_p: float = None
):
    try:
        # Read the image file
        image_data = await file.read()
        
        # Create request object
        request = ImageRequest(
            prompt=prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p
        )
        
        # Send to OpenAI
        response = send_image_message(image_data, request)
        
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
