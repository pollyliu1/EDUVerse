import SlideLoader from "./SlideLoader";
import ThreeScene from "./ThreeScene";
import * as THREE from "three";

interface HandPosition {
  left: THREE.Vector3 | null;
  right: THREE.Vector3 | null;
}

class Game {
  scene: ThreeScene;
  slideLoader: SlideLoader;

  constructor() {
    this.scene = new ThreeScene();
    this.slideLoader = new SlideLoader(this.scene);
  }

  init() {
    this.scene.init();
    this.slideLoader.loadSlides();

    setInterval(() => {
      this.scene.animate();
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
