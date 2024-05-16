import { Viewer, ScreenSpaceEventHandler } from "cesium";

import { toCartographic, onEscape } from "./lib/utils";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";
import type { CartographicDegrees } from "./types";

declare module "cesium" {
  interface Viewer {
    pickLocation: () => Promise<CartographicDegrees>;
  }
}

/**
 * Waits for a user click and resolves a promise with the cartographic
 * position that the user clicked
 * @param {Viewer} viewer cesium viewer instance
 * @returns {Promise<CartographicDegrees|undefined>}
 */
function pickLocation(viewer: Viewer) {
  return new Promise((resolve) => {
    const ele = viewer.canvas;
    const handler = new Handler(ele);

    const removeEscapeListener = onEscape(() => {
      resolve(undefined);
      reset();
    });

    const helper = new Helper(viewer, {
      text: "Click to select a location or press Escape to cancel.",
      icon: "cursor-click",
    });

    /**
     * Removes all event listeners and destroys the screen space event handler
     */
    function reset() {
      try {
        handler.destroy();
        helper.hide();
        removeEscapeListener();
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
    function onClick(event: ScreenSpaceEventHandler.PositionedEvent) {
      // convert position to cartographic
      const cartographic = toCartographic(event.position, viewer);
      // reset handlers and listeners
      reset();
      resolve(cartographic);
    }

    /**
     * Iniialize listeners
     */
    function init() {
      handler.on("left_click", onClick);
      helper.show();
    }

    init();
  });
}

export default function (viewer: Viewer) {
  Object.defineProperties(Viewer.prototype, {
    pickLocation: {
      value: () => pickLocation(viewer),
    },
  });
}
