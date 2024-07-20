import { Viewer, ScreenSpaceEventHandler, Entity, Cartesian2 } from "cesium";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";

declare module "cesium" {
  interface Viewer {
    tooltips: {
      enable: () => void
      disable: () => void
      enabled: boolean
    }
  }
}

class Tooltips {
  ele: HTMLCanvasElement
  handler: Handler
  helper: Helper
  enabled: boolean

  constructor(public viewer: Viewer) {
    this.ele = viewer.canvas;
    this.handler = new Handler(this.ele);
    this.enabled = false

    const options = {
      styles: { display: "none", fontSize: "12px", lineHeight: "12px" },
    }

    // create a new tooltip, styled so that it is initially hidden and is slightly smaller than the others
    this.helper = new Helper(this.viewer, options);
  }

  /**
   * Enable listening for mouse events and showing the tooltips
   */
  enable() {
    this.handler.on("mouse_move", (event: ScreenSpaceEventHandler.MotionEvent) => this.onMove(event));
    this.enabled = true
  }

  /**
   * Disable listening for mouse events and showing the tooltips
   */
  disable() {
    this.handler.off('mouse_move')
    this.enabled = false
  }

  /**
   * Shows the tooltip at the cursor location (plus an offset) for the provided entity
   * @param entity hovered entity
   * @param at cartesian position of the cursor
   */
  show(entity: Entity, at: Cartesian2) {
    const { name } = entity;
    const { x, y } = at;

    if (!name) {
      this.hide();
    } else {
      this.helper.show();
      const left = x + 20 + "px";
      const top = y - 25 + "px";
      this.helper.update(name);
      this.helper.setStyles({ display: "block", top, left });
    }
  }

  /**
   * Hides the tooltip when no entity is hovered or the entity has no name
   */
  hide() {
    if (this.helper.isVisible()) this.helper.hide();
  }

  /**
   * When the mouse moves, check to see if there are any entities under it
   * if there are, show the tooltip with the entity name
   * if not, hide the tooltip
   * @param event mouse move event
   */
  onMove(event: ScreenSpaceEventHandler.MotionEvent) {
    const position = event.endPosition;
    const hovering = this.viewer.scene.drillPick(position);
    const [primitive] = hovering;

    if (primitive) {
      const entity = primitive.id;
      this.show(entity, position);
    } else {
      this.hide();
    }
  }

}

interface TooltipOptions {
  enabled: boolean
}

export default function (viewer: Viewer, options: TooltipOptions = { enabled: false }) {
  const tooltips = new Tooltips(viewer)

  if (options.enabled) tooltips.enable()

  Object.defineProperties(Viewer.prototype, {
    tooltips: {
      value: {
        enable: () => tooltips.enable(),
        disable: () => tooltips.disable(),
        get enabled() { return tooltips.enabled }
      },
      writable: true
    }
  })
}
