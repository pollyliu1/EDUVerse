#!/bin/bash

# Check if the current directory is /python
if [ "$(basename "$PWD")" != "python" ]; then
    echo "Error: Please navigate to the /python directory and try again."
    exit 1
fi

# Check if the virtual environment folder exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found."
    echo "Please create one by running:"
    echo "python3 -m venv venv"
    echo "Then activate it with:"
    echo "source venv/bin/activate"
    exit 1
fi


# check if they've run source venv/bin/activate
if [ -z "$VIRTUAL_ENV" ]; then
    echo "Error: Please activate the virtual environment by running:"
    echo "source venv/bin/activate"
    exit 1
fi

# Install dependencies
pip install -r pip-freeze.txt

# Run the FastAPI server
uvicorn server:app --reload