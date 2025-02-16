import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";
import { OculusHandModel } from "three/addons/webxr/OculusHandModel.js";
// import { World, System, Component, TagComponent, Types } from "three/addons/libs/ecsy.module.js";

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

    // Create draggable cubes
    this.createDraggableCubes();
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

    // setup objects in scene and entities
    const floorGeometry = new THREE.PlaneGeometry(4, 4);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);

    // add a directional light that points downwards
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 10, 0);
    this.scene.add(directionalLight);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.far = 15;
    directionalLight.shadow.camera.near = 5;

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
            // Use the transform matrix from XRJointSpace
            // const transform = wrist.transform;
            // const matrix = new THREE.Matrix4().fromArray(transform.matrix);
            // matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
            // console.log(`Wrist position (${handedness}): x=${position.x}, y=${position.y}, z=${position.z}`);

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

  createDraggableCubes() {
    const cubePositions = [new THREE.Vector3(-1, 0.5, -2), new THREE.Vector3(0, 0.5, -2), new THREE.Vector3(1, 0.5, -2)];

    cubePositions.forEach((position) => {
      const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.copy(position);
      this.scene.add(cube);

      // const entity = world.createEntity();
      // entity.addComponent(Intersectable);
      // entity.addComponent(Draggable);
      // entity.addComponent(Object3D, { object: cube });
    });
  }
}

export default ThreeScene;
