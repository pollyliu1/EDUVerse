import SlideLoader from "./SlideLoader";
import ThreeScene from "./ThreeScene";

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
  }
}

export default Game;
