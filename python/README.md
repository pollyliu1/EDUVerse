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

