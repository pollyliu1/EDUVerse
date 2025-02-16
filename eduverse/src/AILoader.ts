import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import ThreeScene from "./ThreeScene";

export default class AILoader {
  loader = new GLTFLoader();
  scene: ThreeScene;
  blob: THREE.Mesh | null = null;

  constructor(scene: ThreeScene) {
    this.scene = scene;
  }

  load() {
    // Create a blob geometry
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);

    // Create a blue material with some shininess
    const material = new THREE.MeshPhongMaterial({
      color: 0x0088ff,
      shininess: 100,
      transparent: true,
      opacity: 0.8
    });

    // Create the blob mesh
    this.blob = new THREE.Mesh(geometry, material);

    // Position it in front of the camera
    this.blob.position.set(-1.5, 1.5, -1);

    // Add it to the scene
    this.scene.scene.add(this.blob);
  }

  animate() {
    if (this.blob) {
      // Rotate the blob
      this.blob.rotation.y += 0.01;

      // Add a floating animation
      this.blob.position.y = 1.5 + Math.sin(Date.now() * 0.001) * 0.1;
    }
  }
}
