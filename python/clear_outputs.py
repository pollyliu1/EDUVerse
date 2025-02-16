import os
import glob

def clear_png_files(output_folder):
    png_files = glob.glob(os.path.join(output_folder, '*.png'))
    for file in png_files:
        os.remove(file)
        print(f"Removed {file}")

if __name__ == "__main__":
    output_folder = 'outputs'  # Change this to your specific output folder if needed
    clear_png_files(output_folder)
    print("All .png files have been removed from the outputs folder.")
