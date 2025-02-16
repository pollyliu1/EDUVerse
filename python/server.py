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
from fastapi.middleware.cors import CORSMiddleware
import sys


load_dotenv('../.env')

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "https://grey-need-permission-disable.trycloudflare.com",
    "https://asked-literally-lt-mattress.trycloudflare.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    voice_id: str = "qDazFCguyJ6M5CH0mFuN" # 3blue1brown voice id

class ImageRequest(BaseModel):
    prompt: str = "Describe the content of this image."
    max_tokens: int | None = None
    temperature: float | None = None
    top_p: float | None = None


# -------------------------------------- Chat --------------------------------------
def send_message(prompt: str, llm: str = "openai", max_tokens: int = None, temperature: float = None, top_p: float = None):
    try:
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
            response= openai_client.chat.completions.create(**request_payload)
            return response.choices[0].message.content
        elif llm == "groq":
            request_payload["model"] = "llama-3.3-70b-versatile"
            response = groq_client.chat.completions.create(**request_payload)
            return response.choices[0].message.content
        else:
            raise HTTPException(status_code=400, detail="Invalid LLM")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    response = send_message(request.prompt, request.llm, request.max_tokens, request.temperature, request.top_p)
    return {"response": response}

    

# -------------------------------------- Speech --------------------------------------
def transcribe_audio(file: UploadFile, provider: str = "groq"):
    try:
        audio_bytes = file.file.read() # await?
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = file.filename
        print(audio_file)
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
        # print stack trace sys.exc_info()
        print(sys.exc_info())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), provider: str = "groq"):
    return transcribe_audio(file, provider)


def generate_speech_audio(input: str, voice_id: str = "qDazFCguyJ6M5CH0mFuN", stream: bool = True, do_play: bool = False):
    try:
        if not stream:  # currently only supports streaming
            response = eleven_labs_client.text_to_speech.convert(
                text=input,
                voice_id=voice_id,
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
                text=input,
                voice_id=voice_id,
                model_id="eleven_turbo_v2_5",
                output_format="mp3_44100_128",
            )
            if do_play:
                play(audio_stream)
            return StreamingResponse(audio_stream, media_type="audio/mpeg")
    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_speech")
async def generate_speech(request: GenerateSpeechRequest):

    audio = generate_speech_audio(request.input, request.voice_id, request.stream)
    return audio


# -------------------------------------- Image --------------------------------------
def send_image_message(image_data: bytes, prompt: str = "Describe the content of this image.", max_tokens: int = None, temperature: float = None, top_p: float = None):
    image_base64 = base64.b64encode(image_data).decode("utf-8")    
    request_payload = {
        "model": "gpt-4o",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
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
    
    if max_tokens is not None:
        request_payload["max_tokens"] = max_tokens
    if temperature is not None:
        request_payload["temperature"] = temperature
    if top_p is not None:
        request_payload["top_p"] = top_p
        
    response = openai_client.chat.completions.create(**request_payload)
    return response.choices[0].message.content

@app.post("/image-to-text")
async def image_to_text(
    file: UploadFile = File(...),
    prompt: str = Form(default="Describe the content of this image."),
    max_tokens: int = Form(default=None),
    temperature: float = Form(default=None),
    top_p: float = Form(default=None)
):
    try:
        image_data = await file.read()
        response = send_image_message(image_data, prompt, max_tokens, temperature, top_p)
        
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# -------------------------------------- Agent Flow --------------------------------------


@app.post("/agent-flow")
async def agent_flow(
    image: UploadFile = File(...),
    audio: UploadFile = File(...)
):
    try:

        image_data = await image.read()
        transcribed_audio = transcribe_audio(audio, provider="groq")
        print(transcribed_audio)

        # clean transcribed audio
        prompt = "The following is transcribed audio. If it is a question or comment that can be answered, " \
            "clean up the transcription. If it is not a question or comment that can be answered, " \
            "respond only with: INVALID" \
            "The transcribed audio is here: " \
            f"{transcribed_audio}"
        
        cleaned_audio_transcript = send_message(prompt, "openai")
        print(cleaned_audio_transcript)
        if "INVALID" in cleaned_audio_transcript:
            # Here, we will say "I'm sorry, I can't answer that. Feel free to ask me a question about your canvas!"
            sorry_response = "I'm sorry, I can't answer that. Feel free to ask me a question about your canvas!"
            speech_response = generate_speech_audio(sorry_response)
            return speech_response
    
        agent_prompt = "The following is a user's question about the image. Answer the question based on the image. " \
            "The user's question is: " \
            f"{cleaned_audio_transcript}"
        
        agent_response = send_image_message(image_data, agent_prompt)
        print(agent_response)
        # Generate speech response
        speech_response = generate_speech_audio(agent_response, do_play=False)
        return speech_response # figure out how to return both
        # return {"text_response": agent_response, "speech_response": speech_response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

