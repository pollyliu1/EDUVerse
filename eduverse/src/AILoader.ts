import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import ThreeScene from "./ThreeScene";

export default class AILoader {
  loader = new GLTFLoader();
  scene: ThreeScene;
  duck: THREE.Group | null = null;

  constructor(scene: ThreeScene) {
    this.scene = scene;
  }

  load() {
    this.loader.load("/gltf/rubber_duck.glb", (gltf) => {
      const duck = gltf.scene;
      duck.children.forEach((child) => {
        child.scale.multiplyScalar(0.0025); // Reduced scale from 0.1 to 0.01 to make duck smaller
      });
      duck.position.set(-1.5, 1.5, -1);
      duck.rotation.y = 8;
      this.duck = duck;
      
      this.scene.scene.add(duck);
    });
  }

  animate() {
    this.duck.position.y = 1.5 + Math.sin(Date.now() * 0.001) * 0.1;
    this.duck.rotation.y += 0.01;
  }
}
