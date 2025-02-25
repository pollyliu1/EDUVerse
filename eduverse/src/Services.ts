import axios from "axios";
import { Howl } from "howler";
import { BACKEND_URL } from "./constants";

export default class Services {
  // upload an image as well as a speech
  static async sendAgentRequest(image: File, audioBlob: Blob) {
    const formData = new FormData();
    formData.append("image", image);
    formData.append("audio", audioBlob, "audio.mp3");

    try {
      const response = await axios.post(`${BACKEND_URL}/agent-flow`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob", // Ensure the response is treated as a binary blob
      });

      // Create a URL for the blob and use Howler to play the sound
      const audioUrl = URL.createObjectURL(response.data);
      const sound = new Howl({
        src: [audioUrl],
        format: ["mp3"],
        autoplay: true,
        onend: () => {
          URL.revokeObjectURL(audioUrl); // Clean up the URL after use
          console.log("Playback finished and URL revoked.");
        },
      });

      console.log("Audio response received and is playing.");
    } catch (error) {
      console.error("Failed to send agent request:", error);
    }
  }

  static async getTextFromImage(file: File, prompt: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("prompt", prompt);

    try {
      const response = await axios.post(`${BACKEND_URL}/image-to-text`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  static uploadAudio(blob: Blob) {
    const formData = new FormData();
    formData.append("file", blob, "recording.wav");
    formData.append("provider", "groq");

    fetch(`${BACKEND_URL}/transcribe`, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Transcript:", data.transcript);
      })
      .catch((error) => {
        console.error("Failed to upload audio:", error);
      });
  }

  static async generateSpeech(text: string) {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/generate_speech`,
        { input: text },
        {
          headers: {
            "Content-Type": "application/json",
          },
          responseType: "blob", // Ensure the response is treated as a binary blob
        }
      );

      // Create a URL for the blob and use Howler to play the sound
      const audioUrl = URL.createObjectURL(response.data);
      const sound = new Howl({
        src: [audioUrl],
        format: ["mp3"],
        autoplay: true,
        onend: () => {
          URL.revokeObjectURL(audioUrl); // Clean up the URL after use
          console.log("Playback finished and URL revoked.");
        },
      });

      console.log("Speech generated and is playing.");
    } catch (error) {
      console.error("Failed to generate speech:", error);
    }
  }
}

globalThis.Services = Services;
