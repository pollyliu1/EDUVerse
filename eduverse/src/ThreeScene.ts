import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

class ThreeScene {
  loader = new THREE.TextureLoader();

  constructor() {}

  init() {
    const mountRef = document.querySelector(".three-container")! as HTMLElement;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x242424);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    mountRef.appendChild(renderer.domElement);

    // Append VR Button
    mountRef.appendChild(VRButton.createButton(renderer));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Load and display image
    const texture = this.loader.load("images/slides/slide1.png");
    const geometry = new THREE.PlaneGeometry(5, 3); // Adjust size as needed
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const imagePlane = new THREE.Mesh(geometry, material);
    imagePlane.position.set(0, 0, -10);
    scene.add(imagePlane);

    // Render the scene once
    renderer.render(scene, camera);

    // animate
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }
}

export default ThreeScene;
