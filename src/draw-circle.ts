import {
  Viewer,
  ScreenSpaceEventHandler,
  Color,
  Cartesian3,
  CallbackProperty,
} from "cesium";
import {
  haversine,
  toCartographic,
  setCursor,
  ranges,
  onEscape,
} from "./lib/utils";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";
import { TemporaryEntity } from "./lib/entity";
import { CartographicDegrees, DrawCircleResult } from "./types";

declare module "cesium" {
  interface Viewer {
    drawcircle: () => Promise<DrawCircleResult>;
  }
}

function drawcircle(viewer: Viewer) {
  return new Promise((resolve) => {
    const id = "drawcircle";
    const ele = viewer.canvas;
    const handler = new Handler(ele);
    const positions: CartographicDegrees[] = [];

    // create ui helper
    const helper = new Helper(viewer, {
      icon: "cursor-click",
      position: "top",
      text: "Click to set the circle origin (Esc to cancel)",
    });

    const removeEscapeListener = onEscape(reset);

    const positionCallback = new CallbackProperty(() => {
      const [origin] = positions;
      if (!origin) return Cartesian3.fromDegrees(0, 0);
      return Cartesian3.fromDegrees(origin.longitude, origin.latitude);
    }, false);

    // Create callback to interactively draw the circle
    // Should always return a value larger than 0
    const callback = new CallbackProperty(() => {
      const [pos1, pos2] = positions;
      if (!pos1 || !pos2) return 0;

      let distance = haversine(pos1, pos2);
      if (distance < 10) distance = 10;
      return distance;
    }, false);

    // Create the base, interactive entity
    const entity = new TemporaryEntity(
      {
        id,
        position: positionCallback,
        ellipse: {
          semiMajorAxis: callback,
          semiMinorAxis: callback,
          material: Color.CHARTREUSE.withAlpha(0.4),
          fill: true,
          rotation: 0,
        },
      },
      viewer
    );

    /**
     * Reset the drawing by removing cached click positions, removing the
     * temporary entity, destroying the event handler, and resetting the cursor
     */
    function reset() {
      try {
        entity.remove();
        positions.length = 0;
        handler.destroy();
        helper.hide();
        setCursor("default", viewer);
        removeEscapeListener();
      } catch {
        console.warn(
          `encountered an error attempting to clean up after drawcircle`
        );
      }
    }

    /**
     * Event handler for when the user clicks on the globe. At first click, we'll set the
     * center point for the ellipse and at the second, we'll get the distance from the center
     * and create the final entity.
     * @param event click event from cesium
     */
    function onFirstClick(event: ScreenSpaceEventHandler.PositionedEvent) {
      // convert x,y to cartographic
      const carto = toCartographic(event.position, viewer);
      if (!carto) return;

      positions.push(carto);
      handler.on("mouse_move", onMove);
    }

    /**
     * Event handler when the user moves their mouse on the globe. Adds the current
     * pointer location to an array that is used to calculate the radius and interactively
     * draw the circle on the globe.
     * @param event mouse move event from cesium
     */
    function onMove(event: ScreenSpaceEventHandler.MotionEvent) {
      const carto = toCartographic(event.endPosition, viewer);
      if (!carto) return;

      // replace the 2nd position in the array with the new mouse cursor position
      positions.splice(1, 1, carto);
      entity.add();

      // get the distance from the center to the current location and update the ui helper
      // with that range
      const [origin, boundary] = positions;
      const distance = haversine(origin, boundary);

      // if the range is over 100_000 m, change the unit to km
      if (distance > 100_000)
        helper.update(
          `${ranges.format(
            distance / 1000
          )} km (radius), click again to finish (Esc to cancel)`
        );
      else
        helper.update(
          `${ranges.format(
            distance
          )} m (radius), click again to finish (Esc to cancel)`
        );

      handler.on("left_click", onFinalClick);
    }

    /**
     * Listens for the second click where we will clear handlers and reset.
     * @param event cesium positioned event
     */
    function onFinalClick(event: ScreenSpaceEventHandler.PositionedEvent) {
      handler.off("left_click");
      handler.off("mouse_move");

      const [origin, boundary] = positions;
      const radius = haversine(origin, boundary);

      resolve({ origin, radius });
      reset();
    }

    /**
     * Set cursor and initialize handlers
     */
    function init() {
      handler.on("left_click", onFirstClick);
      helper.show();
      setCursor("crosshair", viewer);
    }

    init();
  });
}

export default function (viewer: Viewer) {
  Object.defineProperties(Viewer.prototype, {
    drawcircle: {
      value: () => drawcircle(viewer),
      writable: true
    },
  });
}
