# Document to Image Converter

This project provides a command-line interface (CLI) tool to convert documents such as PDFs, PowerPoint presentations, Keynote files, and Google Slides into a series of images.

## Installation

First, ensure you have Python installed. Then, install the required packages:

### Step 1: Create a Virtual Environment

`cd python && python -m venv venv`

### Step 2: Activate the Virtual Environment

`source venv/bin/activate`

### Step 3: Install the Required Packages

`pip install -r pip-freeze.txt`

### Step 4: Install Poppler (macOS)

`brew install poppler`

### Usage

Convert a PDF to images:

```bash
python convert_to_images.py example.pdf [output_folder]
```

Convert a PPTX to images:

```bash
python convert_to_images.py example.pptx [output_folder]
```

Convert a Keynote to images:

```bash
python convert_to_images.py example.key [output_folder]
```

Convert a Google Slides to images:

```bash
python convert_to_images.py example.slide [output_folder]
```

If you do not specify an `output_folder`, the images will be saved in the `/outputs` directory by default.
It can automatically detect the file type if you do not specify the file type.

### Examples

```bash
python convert_to_images.py examples/waterloo-strat-plan-2019-2023.pdf
```

```bash
python convert_to_images.py examples/slide.pptx
```

### Clean Up

Clear output folder for testing:

```bash
python3 clear_outputs.py
```

# FastAPI server

Create a `.env` file and add your API keys:

```bash
cp .env.example .env
# modify the .env file
```

Run the server:

```bash
./run_server.sh
```

Once the server is running, you can access it by navigating to http://127.0.0.1:8000 in your web browser.

### Query the server

OpenAI:

```bash
curl -X POST "http://127.0.0.1:8000/chat" -H "Content-Type: application/json" -d '{"prompt": "Whats the capital of France?", "llm": "openai"}'
```

Groq:

```bash
curl -X POST "http://127.0.0.1:8000/chat" -H "Content-Type: application/json" -d '{"prompt": "Whats the capital of France?", "llm": "groq"}'
```

## Transcribe

```bash
curl -X POST "http://127.0.0.1:8000/transcribe" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@examples/harvard.wav" \
     -F "provider=groq"
```

You can also use "openai" as the provider.

## Generate Speech

```bash
curl -X POST "http://localhost:8000/generate_speech" \
     -H "Content-Type: application/json" \
     -d '{"input": "Hi, my name is Hargun. I study software engineering at the University of Waterloo!"}' \
     --output outputs/result.mp3
```

Other optional parameters:

- `stream`: whether to stream the audio
- `voice_id`: the voice id to use

### Image to Text

Describe the image (default):

```bash
curl -X POST "http://127.0.0.1:8000/image-to-text" \
-H "Content-Type: multipart/form-data" \
-F "file=@examples/chill.jpg" \
-F "prompt=Does this character seem trustworthy?"
```

Optional parameters:

- `prompt`: the prompt to use
- `max_tokens`: the maximum number of tokens to generate
- `temperature`: the temperature of the model
- `top_p`: the top p of the model

Additional example:

```bash
curl -X POST "http://127.0.0.1:8000/image-to-text" \
-H "Content-Type: multipart/form-data" \
-F "file=@examples/code.png" \
-F "prompt=what color is the image?"
```
