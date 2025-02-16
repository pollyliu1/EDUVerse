import * as THREE from "three";
import ThreeScene from "./ThreeScene";

export default class SlideLoader {
  loader = new THREE.TextureLoader();
  slideTextures: THREE.Texture[] = [];
  slides: THREE.Mesh[] = [];

  currentSlideIndex = 0;

  constructor(readonly scene: ThreeScene) {}

  loadSlides() {
    const NUM_SLIDES = 4;
    const promises = [];
    for (let i = 1; i <= NUM_SLIDES; i++) {
      const promise = new Promise<THREE.Texture>((resolve) => {
        this.loader.load(`/images/slides/slide${i}.png`, (texture) => {
          resolve(texture);
        });
      });
      promises.push(promise);
    }

    Promise.all(promises).then((textures) => {
      textures.forEach((texture) => {
        this.slideTextures.push(texture);
        this.createSlide(texture);
      });
    });
  }

  createSlide(texture: THREE.Texture) {
    const geometry = new THREE.PlaneGeometry(5, 3);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const imagePlane = new THREE.Mesh(geometry, material);
    imagePlane.position.set(0, 0, -10);
    this.slides.push(imagePlane);
    this.scene.scene.add(imagePlane);
  }

  update() {
    // only show the current slide
    this.slides.forEach((slide) => {
      slide.visible = false;
    });
    this.slides[this.currentSlideIndex].visible = true;
  }
}
