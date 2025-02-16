import axios from "axios";

export default class Services {
  static async getTextFromImage(file: File, prompt: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("prompt", prompt);

    try {
      const response = await axios.post("http://127.0.0.1:8000/image-to-text", formData, {
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

    fetch("http://127.0.0.1:8000/transcribe", {
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
}
