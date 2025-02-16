import * as THREE from "three";
import AILoader from "./AILoader";
import SlideLoader from "./SlideLoader";
import ThreeScene from "./ThreeScene";
import { getMicrophoneStream, startRecording, stopRecording } from "./AudioManager";
import Services from "./Services";

interface HandPosition {
  left: THREE.Vector3 | null;
  right: THREE.Vector3 | null;
}

class Game {
  scene: ThreeScene;
  aiLoader: AILoader;
  slideLoader: SlideLoader;

  isSelecting = false;
  get isRecording() {
    return this.mediaRecorder !== null;
  }
  mediaRecorder: MediaRecorder | null = null;
  mouse = {
    x: 0,
    y: 0,
  };

  constructor() {
    this.scene = new ThreeScene();
    this.aiLoader = new AILoader(this.scene);
    this.slideLoader = new SlideLoader(this.scene);

    document.addEventListener("mousemove", (event) => {
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
    });

    document.addEventListener("mousedown", () => {
      this.startRecording();
    });

    document.addEventListener("mouseup", () => {
      this.stopRecording();
    });

    getMicrophoneStream();
  }

  startRecording() {
    startRecording().then((recorder) => {
      this.mediaRecorder = recorder;
    });
  }

  stopRecording() {
    stopRecording(this.mediaRecorder);
    this.mediaRecorder = null;
  }

  init() {
    this.scene.init();
    this.slideLoader.loadSlides();
    this.aiLoader.load();
    setInterval(() => {
      this.scene.animate();
      this.aiLoader.animate();
    }, 1000 / 60);
  }

  update() {
    this.slideLoader.update();
    // Additional update logic can be added here
  }

  getHandPositions(): HandPosition {
    return this.scene.getHandPositions();
  }

  sendImageToAI(index = 0) {
    const filePath = `images/textbook/complex-numbers-${index}.png`;
    fetch(filePath)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], `complex-numbers-${index}.png`, { type: "image/png" });
        return Services.getTextFromImage(file, "What is the text in the image?");
      })
      .then((text) => console.log("Extracted Text:", text))
      .catch((error) => console.error("Failed to extract text:", error));
  }
}

export default Game;
