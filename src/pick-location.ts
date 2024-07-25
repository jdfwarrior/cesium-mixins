import { Viewer, ScreenSpaceEventHandler } from "cesium";

import { toCartographic, onEscape } from "./lib/utils";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";
import type { CartographicDegrees } from "./types";

class PickLocation {
  private viewer: Viewer;
  private ele: HTMLCanvasElement;
  private handler: Handler | undefined;
  private helper: Helper;
  private cleanup: () => void;
  private resolver: (entities: CartographicDegrees | undefined) => void;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.ele = viewer.canvas;
    this.resolver = () => { };

    this.cleanup = onEscape(() => {
      this.resolver(undefined);
      this.reset();
    });

    this.helper = new Helper(viewer, {
      text: "Click to select a location (Esc to cancel)",
      icon: "cursor-click",
    });
  }

  /**
   * Removes all event listeners and destroys the screen space event handler
   */
  reset() {
    try {
      this.handler?.destroy();
      this.helper.hide();
      this.cleanup();
    } catch {
      console.warn(
        `encountered an error attempting to clean up after picklocation`
      );
    }
  }

  /**
   * Handler for when the user clicks the left mouse button,
   * converts the cartesian2 position that they clicked into a
   * cartographic degrees representation and resolves that value back out
   * @param event the left click event from cesium
   */
  onClick(event: ScreenSpaceEventHandler.PositionedEvent) {
    // convert position to cartographic
    const cartographic = toCartographic(event.position, this.viewer);
    // reset handlers and listeners
    this.reset();
    this.resolver(cartographic);
  }

  pick() {
    return new Promise((resolve) => {
      this.resolver = resolve;
      this.handler = new Handler(this.ele);
      this.handler.on(
        "left_click",
        (event: ScreenSpaceEventHandler.PositionedEvent) => this.onClick(event)
      );
      this.helper.show();
    });
  }
}

export default (viewer: Viewer) => {
  const item = new PickLocation(viewer);
  return async () => await item.pick();
};
