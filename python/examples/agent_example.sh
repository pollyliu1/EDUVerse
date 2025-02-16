curl -X POST "http://127.0.0.1:8000/agent-flow" \
     -H "Content-Type: multipart/form-data" \
     -F "image=@complex-numbers-3.png" \
     -F "audio=@agent-test-describe-first-paragraph.mp3"
