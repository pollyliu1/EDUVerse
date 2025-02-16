import * as THREE from "three";
import AILoader from "./AILoader";
import SlideLoader from "./SlideLoader";
import ThreeScene from "./ThreeScene";
import { getMicrophoneStream, startRecording, stopRecording } from "./AudioManager";
import Services from "./Services";
import ModelLoader from "./ModelLoader";

interface HandPosition {
  left: THREE.Vector3 | null;
  right: THREE.Vector3 | null;
}

class Game {
  scene: ThreeScene;
  aiLoader: AILoader;
  slideLoader: SlideLoader;
  modelLoader: ModelLoader;

  isSelecting = false;
  get isRecording() {
    return this.mediaRecorder !== null;
  }
  mediaRecorder: MediaRecorder | null = null;
  mouse = {
    x: 0,
    y: 0,
  };

  lastRecordingTime = 0;
  currentlyRecording = false;

  constructor() {
    this.scene = new ThreeScene();
    this.aiLoader = new AILoader(this.scene);
    this.slideLoader = new SlideLoader(this.scene);
    this.modelLoader = new ModelLoader(this.scene);
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

    // getMicrophoneStream();
  }

  startRecording() {
    this.currentlyRecording = true;
    startRecording().then((recorder) => {
      this.mediaRecorder = recorder;
    });
  }

  stopRecording() {
    this.currentlyRecording = false;
    stopRecording(this.mediaRecorder);
    this.mediaRecorder = null;
  }

  init() {
    this.scene.init();
    this.slideLoader.loadSlides();
    this.aiLoader.load();
    setInterval(() => {
      this.update();
      this.scene.animate();
      this.aiLoader.animate();
    }, 1000 / 60);
  }

  update() {
    this.slideLoader.update();
    // Additional update logic can be added here

    // get the distance between the left and right hand
    const handPositions = this.getHandPositions();
    const distance = handPositions.left?.distanceTo(handPositions.right || new THREE.Vector3(0, 0, 0));

    if (!distance) return;

    // if the distance is less than 0.1, then send the image to the AI
    if (distance < 0.1 && !this.currentlyRecording) {
      // start recording
      this.startRecording();
      this.lastRecordingTime = Date.now();
    } else if (this.currentlyRecording && distance > 0.1) {
      this.stopRecording();
    }

    // // get the distance between the left hand and the microphone
    // const handPositions = this.getHandPositions();
    // const distance = handPositions.left?.distanceTo(this.modelLoader.microphone?.position || new THREE.Vector3(0, 0, 0));
    // console.log(distance);

    // // if the distance is less than 0.1, then send the image to the AI
    // if (distance && distance < 0.1) {
    //   this.sendImageToAI();
    // }
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
