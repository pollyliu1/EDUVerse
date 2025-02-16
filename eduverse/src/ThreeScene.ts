import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

class ThreeScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1.6, 3);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
  }

  init() {
    const mountRef = document.querySelector(".three-container")! as HTMLElement;

    // Scene
    this.scene.background = new THREE.Color(0x242424);

    // Append VR Button
    mountRef.appendChild(this.renderer.domElement);
    mountRef.appendChild(VRButton.createButton(this.renderer));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(10, 10, 10);
    this.scene.add(pointLight);

    // Render the scene once
    this.renderer.render(this.scene, this.camera);

    // animate
    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
    });
  }
}

export default ThreeScene;
