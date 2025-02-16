from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from PIL import Image
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
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
    

# Define a Pydantic model for the image request
class ImageRequest(BaseModel):
    prompt: str = "Describe the content of this image."
    max_tokens: int = None
    temperature: float = None
    top_p: float = None

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
        "max_tokens": 300
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
    prompt: str | None = Form(default="Describe the content of this image."),
    max_tokens: int | None = Form(default=None),
    temperature: float | None = Form(default=None),
    top_p: float | None = Form(default=None)
):
    try:
        # Read the image file
        image_data = await file.read()
        
        # Create request object
        request = ImageRequest(
            prompt=prompt or "Describe the content of this image.",  # Use default if prompt is None
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p
        )
        
        # Send to OpenAI
        response = send_image_message(image_data, request)
        
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
