# Document to Image Converter

This project provides a command-line interface (CLI) tool to convert documents such as PDFs, PowerPoint presentations, Keynote files, and Google Slides into a series of images.

## Installation

First, ensure you have Python installed. Then, install the required packages:

```bash
python python/convert_to_images.py <input_file> <output_folder> --type <file_type>
- `<input_file>`: Path to the input file (e.g., PDF, PPTX, Keynote, Google Slides)
- `<output_folder>`: Path to the output folder where images will be saved
- `<file_type>`: Type of the input file (e.g., pdf, pptx, key, slide)
```

### Examples

Convert a PDF to images:

```bash
python python/convert_to_images.py example.pdf output_folder --type pdf
```

Convert a PPTX to images:

```bash
python python/convert_to_images.py example.pptx output_folder --type pptx
```

Convert a Keynote to images:

```bash
python python/convert_to_images.py example.key output_folder --type key
```

Convert a Google Slides to images:

```bash
python python/convert_to_images.py example.slide output_folder --type slide
```
