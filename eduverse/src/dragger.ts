import { Component, System, TagComponent, Types } from "three/addons/libs/ecsy.module.js";

export class Object3D extends Component {}

Object3D.schema = {
  object: { type: Types.Ref },
};

export class Button extends Component {}

Button.schema = {
  // button states: [none, hovered, pressed]
  currState: { type: Types.String, default: "none" },
  prevState: { type: Types.String, default: "none" },
  action: { type: Types.Ref, default: () => {} },
};

export class ButtonSystem extends System {
  execute(/*delta, time*/) {
    this.queries.buttons.results.forEach((entity) => {
      const button = entity.getMutableComponent(Button);
      const buttonMesh = entity.getComponent(Object3D).object;
      if (button.currState == "none") {
        buttonMesh.scale.set(1, 1, 1);
      } else {
        buttonMesh.scale.set(1.1, 1.1, 1.1);
      }

      if (button.currState == "pressed" && button.prevState != "pressed") {
        button.action();
      }

      // preserve prevState, clear currState
      // HandRaySystem will update currState
      button.prevState = button.currState;
      button.currState = "none";
    });
  }
}

ButtonSystem.queries = {
  buttons: {
    components: [Button],
  },
};

export class Draggable extends Component {}

Draggable.schema = {
  // draggable states: [detached, hovered, to-be-attached, attached, to-be-detached]
  state: { type: Types.String, default: "none" },
  originalParent: { type: Types.Ref, default: null },
  attachedPointer: { type: Types.Ref, default: null },
};

export class DraggableSystem extends System {
  execute(/*delta, time*/) {
    this.queries.draggable.results.forEach((entity) => {
      const draggable = entity.getMutableComponent(Draggable);
      const object = entity.getComponent(Object3D).object;
      if (draggable.originalParent == null) {
        draggable.originalParent = object.parent;
      }

      switch (draggable.state) {
        case "to-be-attached":
          draggable.attachedPointer.children[0].attach(object);
          draggable.state = "attached";
          break;
        case "to-be-detached":
          draggable.originalParent.attach(object);
          draggable.state = "detached";
          break;
        default:
          object.scale.set(1, 1, 1);
      }
    });
  }
}

DraggableSystem.queries = {
  draggable: {
    components: [Draggable],
  },
};

export class Intersectable extends TagComponent {}

export class HandRaySystem extends System {
  init(attributes) {
    this.handPointers = attributes.handPointers;
  }

  execute(/*delta, time*/) {
    this.handPointers.forEach((hp) => {
      let distance = null;
      let intersectingEntity = null;
      this.queries.intersectable.results.forEach((entity) => {
        const object = entity.getComponent(Object3D).object;
        const intersections = hp.intersectObject(object, false);
        if (intersections && intersections.length > 0) {
          if (distance == null || intersections[0].distance < distance) {
            distance = intersections[0].distance;
            intersectingEntity = entity;
          }
        }
      });
      if (distance) {
        hp.setCursor(distance);
        if (intersectingEntity.hasComponent(Button)) {
          const button = intersectingEntity.getMutableComponent(Button);
          if (hp.isPinched()) {
            button.currState = "pressed";
          } else if (button.currState != "pressed") {
            button.currState = "hovered";
          }
        }

        if (intersectingEntity.hasComponent(Draggable)) {
          const draggable = intersectingEntity.getMutableComponent(Draggable);
          const object = intersectingEntity.getComponent(Object3D).object;
          object.scale.set(1.1, 1.1, 1.1);
          if (hp.isPinched()) {
            if (!hp.isAttached() && draggable.state != "attached") {
              draggable.state = "to-be-attached";
              draggable.attachedPointer = hp;
              hp.setAttached(true);
            }
          } else {
            if (hp.isAttached() && draggable.state == "attached") {
              console.log("hello");
              draggable.state = "to-be-detached";
              draggable.attachedPointer = null;
              hp.setAttached(false);
            }
          }
        }
      } else {
        hp.setCursor(1.5);
      }
    });
  }
}

HandRaySystem.queries = {
  intersectable: {
    components: [Intersectable],
  },
};

export class HandsInstructionText extends TagComponent {}

export class InstructionSystem extends System {
  init(attributes) {
    this.controllers = attributes.controllers;
  }

  execute(/*delta, time*/) {
    let visible = false;
    this.controllers.forEach((controller) => {
      if (controller.visible) {
        visible = true;
      }
    });

    this.queries.instructionTexts.results.forEach((entity) => {
      const object = entity.getComponent(Object3D).object;
      object.visible = visible;
    });
  }
}

InstructionSystem.queries = {
  instructionTexts: {
    components: [HandsInstructionText],
  },
};

export class OffsetFromCamera extends Component {}

OffsetFromCamera.schema = {
  x: { type: Types.Number, default: 0 },
  y: { type: Types.Number, default: 0 },
  z: { type: Types.Number, default: 0 },
};

export class NeedCalibration extends TagComponent {}

export class CalibrationSystem extends System {
  init(attributes) {
    this.camera = attributes.camera;
    this.renderer = attributes.renderer;
  }

  execute(/*delta, time*/) {
    this.queries.needCalibration.results.forEach((entity) => {
      if (this.renderer.xr.getSession()) {
        const offset = entity.getComponent(OffsetFromCamera);
        const object = entity.getComponent(Object3D).object;
        const xrCamera = this.renderer.xr.getCamera();
        object.position.x = xrCamera.position.x + offset.x;
        object.position.y = xrCamera.position.y + offset.y;
        object.position.z = xrCamera.position.z + offset.z;
        entity.removeComponent(NeedCalibration);
      }
    });
  }
}

CalibrationSystem.queries = {
  needCalibration: {
    components: [NeedCalibration],
  },
};

export class Randomizable extends TagComponent {}

export class RandomizerSystem extends System {
  init(/*attributes*/) {
    this.needRandomizing = true;
  }

  execute(/*delta, time*/) {
    if (!this.needRandomizing) {
      return;
    }

    this.queries.randomizable.results.forEach((entity) => {
      const object = entity.getComponent(Object3D).object;

      object.material.color.setHex(Math.random() * 0xffffff);

      object.position.x = Math.random() * 2 - 1;
      object.position.y = Math.random() * 2;
      object.position.z = Math.random() * 2 - 1;

      object.rotation.x = Math.random() * 2 * Math.PI;
      object.rotation.y = Math.random() * 2 * Math.PI;
      object.rotation.z = Math.random() * 2 * Math.PI;

      object.scale.x = Math.random() + 0.5;
      object.scale.y = Math.random() + 0.5;
      object.scale.z = Math.random() + 0.5;
      this.needRandomizing = false;
    });
  }
}

RandomizerSystem.queries = {
  randomizable: {
    components: [Randomizable],
  },
};
