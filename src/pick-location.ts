import { Viewer, ScreenSpaceEventHandler } from "cesium";

import { toCartographic, onEscape } from "./lib/utils";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";
import type { CartographicDegrees } from "./types";

class PickLocation {
  private viewer: Viewer;
  private ele: HTMLCanvasElement;
  private handler: Handler;
  private helper: Helper;
  private cleanup: () => void;
  private resolver: (entities: CartographicDegrees | undefined) => void;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.ele = viewer.canvas;
    this.resolver = () => {};
    this.handler = new Handler(this.ele);

    this.cleanup = onEscape(() => {
      this.resolver(undefined);
      this.reset();
    });

    this.helper = new Helper(viewer, {
      text: "Click to select a location or press Escape to cancel.",
      icon: "cursor-click",
    });
  }

  /**
   * Removes all event listeners and destroys the screen space event handler
   */
  reset() {
    try {
      this.handler.destroy();
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
      this.handler.on(
        "left_click",
        (event: ScreenSpaceEventHandler.PositionedEvent) => this.onClick(event)
      );
      this.helper.show();
    });
  }
}

/**
 * Waits for a user click and resolves a promise with the cartographic
 * position that the user clicked
 * @param {Viewer} viewer cesium viewer instance
 * @returns {Promise<CartographicDegrees|undefined>}
 */
// function pickLocation(viewer: Viewer) {
//   return new Promise((resolve) => {
//     const ele = viewer.canvas;
//     const handler = new Handler(ele);

//     const removeEscapeListener = onEscape(() => {
//       resolve(undefined);
//       reset();
//     });

//     const helper = new Helper(viewer, {
//       text: "Click to select a location or press Escape to cancel.",
//       icon: "cursor-click",
//     });

//     /**
//      * Removes all event listeners and destroys the screen space event handler
//      */
//     function reset() {
//       try {
//         handler.destroy();
//         helper.hide();
//         removeEscapeListener();
//       } catch {
//         console.warn(
//           `encountered an error attempting to clean up after picklocation`
//         );
//       }
//     }

//     /**
//      * Handler for when the user clicks the left mouse button,
//      * converts the cartesian2 position that they clicked into a
//      * cartographic degrees representation and resolves that value back out
//      * @param event the left click event from cesium
//      */
//     function onClick(event: ScreenSpaceEventHandler.PositionedEvent) {
//       // convert position to cartographic
//       const cartographic = toCartographic(event.position, viewer);
//       // reset handlers and listeners
//       reset();
//       resolve(cartographic);
//     }

//     /**
//      * Iniialize listeners
//      */
//     function init() {
//       handler.on("left_click", onClick);
//       helper.show();
//     }

//     init();
//   });
// }

export default (viewer: Viewer) => {
  const item = new PickLocation(viewer);
  return async () => await item.pick();
};
