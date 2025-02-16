import * as THREE from "three";
import AILoader from "./AILoader";
import SlideLoader from "./SlideLoader";
import ThreeScene from "./ThreeScene";

interface HandPosition {
  left: THREE.Vector3 | null;
  right: THREE.Vector3 | null;
}

class Game {
  scene: ThreeScene;
  aiLoader: AILoader;
  slideLoader: SlideLoader;

  isSelecting = false;

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
      this.isSelecting = true;
    });

    document.addEventListener("mouseup", () => {
      this.isSelecting = false;
    });
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
}

export default Game;
