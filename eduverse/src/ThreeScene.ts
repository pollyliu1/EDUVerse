import * as THREE from "three";
import { World } from "three/addons/libs/ecsy.module.js";
import { OculusHandModel } from "three/addons/webxr/OculusHandModel.js";
import { OculusHandPointerModel } from "three/addons/webxr/OculusHandPointerModel.js";
import { createText } from "three/addons/webxr/Text2D.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";
import {
  Button,
  ButtonSystem,
  CalibrationSystem,
  Draggable,
  DraggableSystem,
  HandRaySystem,
  HandsInstructionText,
  InstructionSystem,
  Intersectable,
  NeedCalibration,
  Object3D,
  OffsetFromCamera,
  Randomizable,
  RandomizerSystem,
} from "./dragger";
import { game } from "./main";
import ModelLoader from "./ModelLoader";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

interface HandPosition {
  left: THREE.Vector3 | null;
  right: THREE.Vector3 | null;
}

function makeButtonMesh(x, y, z, color) {
  const geometry = new THREE.BoxGeometry(x, y, z);
  const material = new THREE.MeshPhongMaterial({ color: color });
  const buttonMesh = new THREE.Mesh(geometry, material);
  return buttonMesh;
}

const FLOOR_HEIGHT = 0;

export class Cube {
  static SIZE = 0.15;
  object: THREE.Group | THREE.Mesh;

  velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  constructor(scene: THREE.Scene, world: World, object?: THREE.Group | THREE.Mesh, name = "cube") {
    this.object =
      object || new THREE.Mesh(new THREE.BoxGeometry(Cube.SIZE, Cube.SIZE, Cube.SIZE), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    scene.add(this.object);

    this.object.name = name;

    const entity = world.createEntity();
    entity.addComponent(Intersectable);
    entity.addComponent(Randomizable);
    entity.addComponent(Object3D, { object: this.object });
    entity.addComponent(Draggable);
  }

  update() {
    // Apply gravity to velocity
    this.velocity.y -= 0.001; // gravity acceleration

    // Update position based on velocity
    const pos = this.object.position;
    pos.x += this.velocity.x;
    pos.y += this.velocity.y;
    pos.z += this.velocity.z;

    // Floor collision and bounce
    if (pos.y < FLOOR_HEIGHT + Cube.SIZE / 2) {
      pos.y = FLOOR_HEIGHT + Cube.SIZE / 2;
      // Reverse velocity with damping for bounce effect
      this.velocity.y = -this.velocity.y * 0.7; // 0.7 is bounce dampening factor

      // Apply friction when hitting the ground
      this.velocity.x *= 0.95;
      this.velocity.z *= 0.95;
    }

    // Update the object position
    this.object.position.set(pos.x, pos.y, pos.z);
  }
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
  handPointer1: OculusHandPointerModel;
  handPointer2: OculusHandPointerModel;
  handModel1: OculusHandModel;
  handModel2: OculusHandModel;

  // Factories for controller and hand models
  controllerModelFactory: XRControllerModelFactory;
  handModelFactory: XRHandModelFactory;

  modelLoader: ModelLoader;

  world = new World();
  clock = new THREE.Clock();

  cubes: Cube[] = [];

  onSelectStart() {
    game.isSelecting = true;
    // game.startRecording();
  }

  onSelectEnd() {
    game.isSelecting = false;
    // game.stopRecording();
  }

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 20);
    this.camera.position.set(0, 1.2, 0.3);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      toneMapping: THREE.ACESFilmicToneMapping,
      outputColorSpace: THREE.SRGBColorSpace,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    // Initialize controller and hand factories
    this.controllerModelFactory = new XRControllerModelFactory();
    this.handModelFactory = new XRHandModelFactory();

    // Initialize controllers and hands
    this.controller1 = this.renderer.xr.getController(0);
    this.scene.add(this.controller1);

    this.controller2 = this.renderer.xr.getController(1);
    this.scene.add(this.controller2);

    // add event listeners for controller and hand models
    this.controller1.addEventListener("selectstart", this.onSelectStart);

    this.controller2.addEventListener("selectstart", this.onSelectStart);

    this.controller1.addEventListener("selectend", this.onSelectEnd);

    this.controller2.addEventListener("selectend", this.onSelectEnd);

    // Initialize controller and hand models with OculusHandModel
    this.loadOculusHandModels();
  }

  async init() {
    const instructionText = createText("Welcome to your personal AI teaching assistant", 0.04);
    instructionText.position.set(0, 1.6, -0.6);
    this.scene.add(instructionText);

    const menuGeometry = new THREE.PlaneGeometry(0.24, 0.5);
    const menuMaterial = new THREE.MeshPhongMaterial({
      opacity: 0,
      transparent: true,
    });
    const menuMesh = new THREE.Mesh(menuGeometry, menuMaterial);
    menuMesh.position.set(0.4, 1, -1);
    menuMesh.rotation.y = -Math.PI / 12;
    this.scene.add(menuMesh);

    const resetButton = makeButtonMesh(0.2, 0.1, 0.01, 0x355c7d);
    const resetButtonText = createText("reset", 0.06);
    resetButton.add(resetButtonText);
    resetButtonText.position.set(0, 0, 0.0051);
    resetButton.position.set(0.4, -0.06, 0);
    menuMesh.add(resetButton);

    const exitButton = makeButtonMesh(0.2, 0.1, 0.01, 0xff0000);
    const exitButtonText = createText("exit", 0.06);
    exitButton.add(exitButtonText);
    exitButtonText.position.set(0, 0, 0.0051);
    exitButton.position.set(0.4, -0.18, 0);
    menuMesh.add(exitButton);

    this.world.registerComponent(Button);
    this.world.registerComponent(Object3D);
    this.world.registerComponent(Intersectable);
    this.world.registerComponent(HandsInstructionText);
    this.world.registerComponent(OffsetFromCamera);
    this.world.registerComponent(NeedCalibration);
    this.world.registerComponent(Randomizable);
    this.world.registerComponent(Draggable);

    this.world
      .registerSystem(RandomizerSystem)
      .registerSystem(InstructionSystem, { controllers: [this.controllerGrip1, this.controllerGrip2] })
      .registerSystem(CalibrationSystem, { renderer: this.renderer, camera: this.camera })
      .registerSystem(ButtonSystem)
      .registerSystem(DraggableSystem)
      .registerSystem(HandRaySystem, { handPointers: [this.handPointer1, this.handPointer2] });

    for (let i = 0; i < 20; i++) {
      const cube = new Cube(this.scene, this.world);
      this.cubes.push(cube);
    }

    const rbEntity = this.world.createEntity();
    rbEntity.addComponent(Intersectable);
    rbEntity.addComponent(Object3D, { object: resetButton });
    const world = this.world;
    const rbAction = function () {
      world.getSystem(RandomizerSystem).needRandomizing = true;
    };
    rbEntity.addComponent(Button, { action: rbAction });

    const ebEntity = this.world.createEntity();
    ebEntity.addComponent(Intersectable);
    ebEntity.addComponent(Object3D, { object: exitButton });
    const ebAction = function () {
      exitButtonText.visible = true;
      setTimeout(function () {
        exitButtonText.visible = false;
        this.renderer.xr.getSession().end();
      }, 2000);
    };

    ebEntity.addComponent(Button, { action: ebAction });

    const itEntity = this.world.createEntity();
    itEntity.addComponent(HandsInstructionText);
    itEntity.addComponent(Object3D, { object: instructionText });

    const mountRef = document.querySelector(".three-container")! as HTMLElement;

    // Scene
    // ROOM BACKGROUND:
    // const rgbeLoader = new RGBELoader();
    // try {
    //   const backgroundTexture = await rgbeLoader.loadAsync('public/gltf/background.hdr');
    //   backgroundTexture.mapping = THREE.EquirectangularReflectionMapping;
    //   this.scene.background = backgroundTexture;
    //   this.scene.environment = backgroundTexture; // This enables reflections
    // } catch (error) {
    //   console.error('Failed to load HDR background:', error);
    //   // Fallback to solid color if HDR loading fails
    //   this.scene.background = new THREE.Color(0x89CFF0);
    // }

    // CAFE BACKGROUND:
    const loader = new EXRLoader();
    try {
      const backgroundTexture = await loader.loadAsync("public/gltf/cafe-background.exr");
      backgroundTexture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = backgroundTexture;
      this.scene.environment = backgroundTexture; // This enables reflections
    } catch (error) {
      console.error("Failed to load HDR background:", error);
      // Fallback to solid color if HDR loading fails
      this.scene.background = new THREE.Color(0x89cff0);
    }

    // Append VR Button
    mountRef.appendChild(this.renderer.domElement);
    mountRef.appendChild(
      VRButton.createButton(this.renderer, {
        requiredFeatures: ["hand-tracking"],
      })
    );

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

    // setup objects in scene and entities
    const floorGeometry = new THREE.PlaneGeometry(4, 4);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.y = FLOOR_HEIGHT;
    this.scene.add(floor);

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
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.elapsedTime;
    this.renderer.xr.updateCamera(this.camera);
    this.world.execute(delta, elapsedTime);

    this.renderer.render(this.scene, this.camera);

    this.cubes.forEach((cube) => {
      cube.update();
    });
  }

  updateHands() {
    const hand1 = this.renderer.xr.getHand(0);
    const hand2 = this.renderer.xr.getHand(1);

    const hand1Joints = hand1.joints;
    const hand2Joints = hand2.joints;

    const index1 = hand1Joints["index-finger-tip"];
    const index2 = hand2Joints["index-finger-tip"];

    this.handPositions.left = index1?.position;
    this.handPositions.right = index2?.position;
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
    this.handModel1 = new OculusHandModel(this.hand1);
    this.hand1.add(this.handModel1);
    this.scene.add(this.hand1);

    const hand1 = this.renderer.xr.getHand(0);
    this.handPointer1 = new OculusHandPointerModel(hand1, this.controller1);
    this.hand1.add(this.handPointer1);

    // Right Hand
    this.controllerGrip2 = this.renderer.xr.getControllerGrip(1);
    this.controllerGrip2.add(controllerModelFactory.createControllerModel(this.controllerGrip2));
    this.scene.add(this.controllerGrip2);

    this.hand2 = this.renderer.xr.getHand(1);
    this.handModel2 = new OculusHandModel(this.hand2);
    this.hand2.add(this.handModel2);
    this.scene.add(this.hand2);

    const hand2 = this.renderer.xr.getHand(1);
    this.handPointer2 = new OculusHandPointerModel(hand2, this.controller2);
    this.hand2.add(this.handPointer2);
  }
}

export default ThreeScene;
