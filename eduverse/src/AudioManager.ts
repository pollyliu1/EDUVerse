import { game } from "./main";
import { Howl } from "howler";
import Services from "./Services";

export async function getMicrophoneStream() {
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return audioStream;
  } catch (error) {
    console.error("Error accessing microphone:", error);
    return null;
  }
}

let currentHowl: Howl | null = null;

export async function startRecording() {
  console.log("start");
  // const videoStream = game.scene.renderer.domElement.captureStream(30); // Capture WebGL output
  const audioStream = await getMicrophoneStream(); // Capture Oculus mic

  if (!audioStream) {
    console.error("No audio stream available!");
    return;
  }

  // Combine video and audio tracks
  // const combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);

  const mediaRecorder = new MediaRecorder(audioStream, { mimeType: "audio/webm" });

  const recordedChunks = [];
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    if (Date.now() - game.lastRecordingTime < 1000) return;

    const audioBlob = new Blob(recordedChunks, { type: "audio/webm" });
    const url = URL.createObjectURL(audioBlob);
    // const a = document.createElement("a");
    // a.href = url;
    // a.download = "vr-recording-with-audio.webm";
    // a.click();
    // URL.revokeObjectURL(url);

    // Autoplay the video
    // const videoElement = document.createElement("video");
    // videoElement.src = url;
    // videoElement.controls = true;
    // videoElement.autoplay = true;
    // document.body.appendChild(videoElement);

    // PLAY BACK THE MIC AUDIO
    const audioUrl = URL.createObjectURL(audioBlob);
    currentHowl?.stop();
    currentHowl = new Howl({
      src: [audioUrl],
      format: ["webm"],
      autoplay: true,
      onend: () => {
        URL.revokeObjectURL(audioUrl); // Clean up the URL after use
      },
    });

    // TRANSCRIBES THE AUDIO INTO TEXT

    const index = game.slideLoader.getCurrentSlide();
    const filePath = `images/textbook/notes-${index}.png`;
    fetch(filePath)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], `notes-${index}.png`, { type: "image/png" });
        Services.sendAgentRequest(file, audioBlob);
      })
      .then((text) => console.log("Extracted Text:", text))
      .catch((error) => console.error("Failed to extract text:", error));
  };

  mediaRecorder.start();
  console.log("Recording started!");

  return mediaRecorder;
}

// Stop recording function
export function stopRecording(mediaRecorder) {
  if (mediaRecorder) {
    mediaRecorder.stop();
    console.log("Recording stopped!");
  }
}

// // Example: Start recording when entering VR, stop when exiting
// renderer.xr.addEventListener('sessionstart', async () => {
//   window.recorder = await startRecording();
// });

// renderer.xr.addEventListener('sessionend', () => {
//   stopRecording(window.recorder);
// });
