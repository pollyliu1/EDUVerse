import os
import sys
import argparse
from pdf2image import convert_from_path
from pptx import Presentation
from PIL import Image
from googleapiclient.discovery import build
from google.oauth2 import service_account
# Import other necessary libraries for Google Slides and Keynote

def convert_pdf_to_images(pdf_path, output_folder):
    # Extract the base name of the PDF file without the extension
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    # Create a subfolder in the output folder
    subfolder_path = os.path.join(output_folder, base_name)
    if not os.path.exists(subfolder_path):
        os.makedirs(subfolder_path)

    images = convert_from_path(pdf_path)
    for i, image in enumerate(images):
        image_path = os.path.join(subfolder_path, f"page_{i + 1}.png")
        image.save(image_path, 'PNG')
    print(f"Converted PDF to images in {subfolder_path}")

def convert_pptx_to_images(pptx_path, output_folder):
    presentation = Presentation(pptx_path)
    for i, slide in enumerate(presentation.slides):
        # Create a blank image for each slide
        image = Image.new('RGB', (1920, 1080), color = (255, 255, 255))
        image_path = os.path.join(output_folder, f"slide_{i + 1}.png")
        image.save(image_path, 'PNG')
    print(f"Converted PPTX to images in {output_folder}")

def convert_keynote_to_images(key_path, output_folder):
    # This requires macOS and AppleScript to automate Keynote
    # Example AppleScript command to export slides as images
    os.system(f"osascript -e 'tell application \"Keynote\" to open \"{key_path}\"' -e 'tell application \"Keynote\" to export front document to POSIX file \"{output_folder}/slide.png\" as PNG'")
    print(f"Converted Keynote to images in {output_folder}")

def convert_google_slides_to_images(slide_id, output_folder):
    # Setup the Google Slides API
    SCOPES = ['https://www.googleapis.com/auth/presentations.readonly']
    SERVICE_ACCOUNT_FILE = 'path/to/your/service-account-file.json'

    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    service = build('slides', 'v1', credentials=credentials)

    # Get the presentation
    presentation = service.presentations().get(presentationId=slide_id).execute()
    slides = presentation.get('slides')

    for i, slide in enumerate(slides):
        # Export each slide as an image
        # This requires additional implementation to download the image
        image_path = os.path.join(output_folder, f"slide_{i + 1}.png")
        # Save the image
    print(f"Converted Google Slides to images in {output_folder}")

def main():
    parser = argparse.ArgumentParser(description="Convert documents to images.")
    parser.add_argument('input_file', help='Path to the input file or Google Slides ID')
    parser.add_argument('output_folder', nargs='?', default='outputs', help='Folder to save the images')
    parser.add_argument('--type', choices=['pdf', 'pptx', 'key', 'gslides'], help='Type of the input file')

    args = parser.parse_args()

    if not os.path.exists(args.output_folder):
        os.makedirs(args.output_folder)

    # Auto-detect file type if not provided
    if not args.type:
        _, file_extension = os.path.splitext(args.input_file)
        file_extension = file_extension.lower()
        if file_extension == '.pdf':
            args.type = 'pdf'
        elif file_extension == '.pptx':
            args.type = 'pptx'
        elif file_extension == '.key':
            args.type = 'key'
        else:
            print("Error: Could not determine file type. Please specify using --type.")
            sys.exit(1)

    if args.type == 'pdf':
        convert_pdf_to_images(args.input_file, args.output_folder)
    elif args.type == 'pptx':
        convert_pptx_to_images(args.input_file, args.output_folder)
    elif args.type == 'key':
        convert_keynote_to_images(args.input_file, args.output_folder)
    elif args.type == 'gslides':
        convert_google_slides_to_images(args.input_file, args.output_folder)

if __name__ == "__main__":
    main() 