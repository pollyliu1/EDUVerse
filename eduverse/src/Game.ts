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

    setInterval(() => {
      this.update();
    }, 1000 / 60);
  }

  update() {
    this.slideLoader.update();
  }
}

export default Game;
