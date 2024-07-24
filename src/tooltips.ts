import { Viewer, ScreenSpaceEventHandler, Entity, Cartesian2 } from "cesium";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";

declare module "cesium" {
  interface Viewer {
    tooltips: Tooltips;
  }
}

class Tooltips {
  ele: HTMLCanvasElement;
  handler: Handler;
  helper: Helper;
  enabled: boolean;

  constructor(public viewer: Viewer) {
    this.ele = viewer.canvas;
    this.handler = new Handler(this.ele);
    this.enabled = false;

    const options = {
      styles: { display: "none", fontSize: "12px", lineHeight: "12px" },
    };

    // create a new tooltip, styled so that it is initially hidden and is slightly smaller than the others
    this.helper = new Helper(this.viewer, options);
  }

  /**
   * Enable listening for mouse events and showing the tooltips
   */
  show() {
    this.handler.on(
      "mouse_move",
      (event: ScreenSpaceEventHandler.MotionEvent) => this.onMove(event)
    );
    this.enabled = true;
  }

  /**
   * Disable listening for mouse events and showing the tooltips
   */
  hide() {
    this.handler.off("mouse_move");
    this.enabled = false;
  }

  /**
   * Toggle the state of tooltips for entities
   */
  toggle() {
    if (this.enabled) this.hide();
    else this.show();
  }

  /**
   * Shows the tooltip at the cursor location (plus an offset) for the provided entity
   * @param entity hovered entity
   * @param at cartesian position of the cursor
   */
  private render(entity: Entity, at: Cartesian2) {
    const { name } = entity;
    const { x, y } = at;

    if (!name) {
      if (this.helper.isVisible()) this.helper.hide();
    } else {
      this.helper.show();
      const left = x + 20 + "px";
      const top = y - 25 + "px";
      this.helper.update(name);
      this.helper.setStyles({ display: "block", top, left });
    }
  }

  /**
   * When the mouse moves, check to see if there are any entities under it
   * if there are, show the tooltip with the entity name
   * if not, hide the tooltip
   * @param event mouse move event
   */
  private onMove(event: ScreenSpaceEventHandler.MotionEvent) {
    const position = event.endPosition;
    const hovering = this.viewer.scene.drillPick(position);
    const [primitive] = hovering;

    if (primitive) {
      const entity = primitive.id;
      this.render(entity, position);
    } else {
      this.helper.hide();
    }
  }
}

export default function (viewer: Viewer) {
  const tooltips = new Tooltips(viewer);

  Object.defineProperties(Viewer.prototype, {
    tooltips: {
      value: tooltips,
      writable: true,
    },
  });
}
