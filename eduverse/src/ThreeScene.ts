import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

class ThreeScene {
  constructor() {}

  static init() {
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

    // Geometry: A spinning cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, -10);
    scene.add(cube);

    // Animation
    const animate = () => {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    // Handle resize
    // const handleResize = () => {
    //   if (mountRef.current) {
    //     const width = mountRef.current.clientWidth;
    //     const height = mountRef.current.clientHeight;
    //     renderer.setSize(width, height);
    //     camera.aspect = width / height;
    //     camera.updateProjectionMatrix();
    //   }
    // };

    // window.addEventListener("resize", handleResize);
  }
}

export default ThreeScene;
