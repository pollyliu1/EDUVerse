import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";
import { OculusHandModel } from "three/addons/webxr/OculusHandModel.js";

interface HandPosition {
  left: THREE.Vector3 | null;
  right: THREE.Vector3 | null;
}

class ThreeScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  handPositions: HandPosition = { left: null, right: null };

  // Controllers and Hands
  controller1: THREE.Group;
  controller2: THREE.Group;
  controllerGrip1: THREE.Group;
  controllerGrip2: THREE.Group;
  hand1: THREE.Group;
  hand2: THREE.Group;

  // Factories for controller and hand models
  controllerModelFactory: XRControllerModelFactory;
  handModelFactory: XRHandModelFactory;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1.6, 3);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;

    // Initialize controller and hand factories
    this.controllerModelFactory = new XRControllerModelFactory();
    this.handModelFactory = new XRHandModelFactory();

    // Initialize controllers and hands
    this.controller1 = this.renderer.xr.getController(0);
    this.scene.add(this.controller1);

    this.controller2 = this.renderer.xr.getController(1);
    this.scene.add(this.controller2);

    // Initialize controller and hand models with OculusHandModel
    this.loadOculusHandModels();
  }

  async init() {
    const mountRef = document.querySelector(".three-container")! as HTMLElement;

    // Scene
    this.scene.background = new THREE.Color(0x242424);

    // Append VR Button
    mountRef.appendChild(this.renderer.domElement);
    mountRef.appendChild(
      VRButton.createButton(this.renderer, {
        requiredFeatures: ["hand-tracking"],
      })
    );

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(10, 10, 10);
    this.scene.add(pointLight);

    // Handle window resize
    window.addEventListener("resize", this.onWindowResize.bind(this));

    // Animate
    this.renderer.setAnimationLoop(this.animate.bind(this));
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    this.updateHands();
    this.renderer.render(this.scene, this.camera);
  }

  updateHands() {
    const session = this.renderer.xr.getSession();
    if (session) {
      const inputSources = session.inputSources;
      inputSources.forEach((inputSource) => {
        if (inputSource.hand) {
          const handedness = inputSource.handedness;
          console.log(`Hand detected: ${handedness}`);

          // Access the wrist joint as an example
          const wrist = inputSource.hand.get("wrist");
          if (wrist) {
            const position = new THREE.Vector3();
            // const quaternion = new THREE.Quaternion();
            // const scale = new THREE.Vector3();
            // const transform = wrist.transform;
            // const matrix = new THREE.Matrix4().fromArray(transform.matrix);
            // matrix.decompose(position, quaternion, scale);
            console.log(`Wrist position (${handedness}): x=${position.x}, y=${position.y}, z=${position.z}`);

            if (handedness === "left") {
              this.handPositions.left = position;
            } else if (handedness === "right") {
              this.handPositions.right = position;
            }
          } else {
            console.log(`Wrist joint not found for ${handedness} hand.`);
          }
        } else {
          console.log("No hand data available for this input source.");
        }
      });
    } else {
      console.log("No XR session available.");
    }
  }

  getHandPositions(): HandPosition {
    return this.handPositions;
  }

  loadOculusHandModels() {
    const controllerModelFactory = new XRControllerModelFactory();

    // Left Hand
    this.controllerGrip1 = this.renderer.xr.getControllerGrip(0);
    this.controllerGrip1.add(controllerModelFactory.createControllerModel(this.controllerGrip1));
    this.scene.add(this.controllerGrip1);

    this.hand1 = this.renderer.xr.getHand(0);
    this.hand1.add(new OculusHandModel(this.hand1));
    this.scene.add(this.hand1);

    // Right Hand
    this.controllerGrip2 = this.renderer.xr.getControllerGrip(1);
    this.controllerGrip2.add(controllerModelFactory.createControllerModel(this.controllerGrip2));
    this.scene.add(this.controllerGrip2);

    this.hand2 = this.renderer.xr.getHand(1);
    this.hand2.add(new OculusHandModel(this.hand2));
    this.scene.add(this.hand2);
  }
}

export default ThreeScene;
