import * as THREE from "three";
import ThreeScene from "./ThreeScene";
import { game } from "./main";

const APPROX_SLIDE_HEIGHT = 0.667;

export default class SlideLoader {
  loader = new THREE.TextureLoader();
  slideTextures: THREE.Texture[] = [];
  slides: THREE.Group = new THREE.Group();

  currentSlidePosition = 0;
  firstSelectedPosition: number | null = null;

  constructor(readonly scene: ThreeScene) {}

  getCurrentSlide(): number {
    const index = Math.floor(this.slides.position.y / (APPROX_SLIDE_HEIGHT * 3));
    // clamp between 1 and 5
    return Math.max(1, Math.min(52, index));
  }

  loadSlides() {
    const NUM_SLIDES = 52;
    const promises = [];
    for (let i = 1; i <= NUM_SLIDES; i++) {
      const promise = new Promise<THREE.Texture>((resolve) => {
        this.loader.load(`/images/textbook/notes-${i}.png`, (texture) => {
          resolve(texture);
        });
      });
      promises.push(promise);
    }

    Promise.all(promises).then((textures) => {
      textures.forEach((texture, index) => {
        this.slideTextures.push(texture);
        this.createSlide(texture, index);
      });
    });

    this.scene.scene.add(this.slides);
  }

  createSlide(texture: THREE.Texture, index: number) {
    const width = 3;
    const height = width * APPROX_SLIDE_HEIGHT;
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const imagePlane = new THREE.Mesh(geometry, material);
    imagePlane.position.set(0, 1 - height * index, -3.5);
    this.slides.add(imagePlane);
  }

  update() {
    const handPositions = this.scene.getHandPositions();

    this.slides.position.y = this.currentSlidePosition;

    let position = handPositions?.right?.y || handPositions?.left?.y;

    if (!position) return;

    position *= 6;

    if (!game.isSelecting) {
      this.firstSelectedPosition = null;
      return;
    }

    if (!this.firstSelectedPosition) {
      this.firstSelectedPosition = position;
    } else {
      const deltaY = position - this.firstSelectedPosition;
      this.currentSlidePosition += deltaY;

      this.slides.position.y = this.currentSlidePosition;

      this.firstSelectedPosition = position;
    }
  }
}
