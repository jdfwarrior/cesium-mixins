import { Viewer, ScreenSpaceEventHandler } from "cesium";
import { onEscape } from "./lib/utils";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";

declare module "cesium" {
  interface Viewer {
    pickEntity: (multiSelect?: boolean) => Promise<Entity[]>;
  }
}

/**
 * Waits for a user click and resolves a promise with the cartographic
 * position that the user clicked
 * @param {Viewer} viewer cesium viewer instance
 * @param {boolean} selectSingle whether to allow selecting more than one entity
 * @returns {Promise<Entity[]>}
 */
function pickEntity(viewer: Viewer, multiSelect: boolean = false) {
  return new Promise((resolve) => {
    const ele = viewer.canvas;
    const handler = new Handler(ele);

    const helper = new Helper({
      text: "Select an entity or press Escape to cancel.",
      icon: "cursor-click",
    });

    const removeEscapeListener = onEscape(() => {
      resolve(undefined);
      reset();
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
        console.warn(`encountered an error attempting to clean up after pickentity`)
      }
    }

    /**
     * Handler for when the user clicks the left mouse button,
     * converts the cartesian2 position that they clicked into a
     * cartographic degrees representation and resolves that value back out
     * @param event the left click event from cesium
     */
    function onClick(event: ScreenSpaceEventHandler.PositionedEvent) {
      const limit = multiSelect ? 5 : 1;
      const primitives = viewer.scene.drillPick(event.position, limit);
      const entities = primitives.map((primitive) => primitive.id);
      // reset handlers and listeners
      reset();
      resolve(entities);
    }

    /**
     * Initialize listeners
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
    pickEntity: {
      value: (multiSelect?: boolean) => pickEntity(viewer, multiSelect),
    },
  });
}
