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

  constructor() {
    this.scene = new ThreeScene();
    this.aiLoader = new AILoader(this.scene);
    this.slideLoader = new SlideLoader(this.scene);
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
