import ThreeScene from "./ThreeScene";

class Game {
  scene = new ThreeScene();

  constructor() {}

  init() {
    this.scene.init();
  }
}

export default Game;
