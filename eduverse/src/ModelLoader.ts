import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import ThreeScene, { Cube } from "./ThreeScene";
import * as THREE from "three";

export default class ModelLoader {
  loader = new GLTFLoader();
  scene: ThreeScene;

  microphone: THREE.Group | null = null;

  constructor(scene: ThreeScene) {
    this.scene = scene;

    this.loadMicrophone();
  }

  loadMicrophone() {
    this.loader.load("/gltf/microphone.glb", (gltf) => {
      const microphone = gltf.scene;
      microphone.scale.multiplyScalar(0.2);
      microphone.position.set(0, 1, -1);
      this.microphone = microphone;

      this.scene.cubes.push(new Cube(this.scene.scene, this.scene.world, microphone));
    });
  }
}
