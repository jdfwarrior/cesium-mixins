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
import { CartographicDegrees, MeasureConfig } from "./types";

declare module "cesium" {
  interface Viewer {
    measure: (config?: MeasureConfig) => Promise<
      | {
        origin: CartographicDegrees;
        destination: CartographicDegrees;
        distance: number;
      }
      | undefined
    >;
  }
}

function measure(viewer: Viewer, config: MeasureConfig = { unit: 'm' }) {
  return new Promise((resolve) => {
    // initialization
    const ele = viewer.canvas;
    const handler = new Handler(ele);
    const positions: CartographicDegrees[] = [];
    const helper = new Helper({
      icon: "cursor-click",
      text: "Click to set measurement origin or press Escape to cancel",
    });
    const removeEscapeListener = onEscape(reset);

    // call back to handle the updating of the positions of the line, as the mouse moves across the globe
    const callback = new CallbackProperty(() => {
      return positions.map((carto) =>
        Cartesian3.fromDegrees(carto.longitude, carto.latitude, carto.altitude)
      );
    }, false);

    const entity = new TemporaryEntity(
      {
        polyline: {
          positions: callback,
          width: 3,
          material: Color.CHARTREUSE,
          clampToGround: true,
        },
      },
      viewer
    );

    /**
     * Reset all event handlers, remove the temporary entity, and reset the cursor
     */
    function reset() {
      try {
        entity.remove();
        handler.destroy();
        helper.hide();
        positions.length = 0;
        setCursor("default", viewer);
        removeEscapeListener();
      } catch {
        console.warn(`encountered an error attempting to clean up after measure`)
      }
    }

    /**
     * At the first click, push the clicked position to the positions array and prepare to draw
     * @param event cesium positioned event
     */
    function onFirstClick(event: ScreenSpaceEventHandler.PositionedEvent) {
      try {
        const carto = toCartographic(event.position, viewer);
        if (!carto) return;

        // cache the position and setup listeners for mouse move and the last click
        positions.push(carto);
        handler.on("mouse_move", onMove);
        handler.on("left_click", onLastClick);
      } catch {
        resolve(undefined);
        reset();
      }
    }

    /**
     * Watch for the mouse to move and each time it does, replace the second position in the positions list
     * with the current position, if the entity hasn't been added to the globe yet, do that, and update
     * the helper text
     * @param event cesium motion event
     */
    function onMove(event: ScreenSpaceEventHandler.MotionEvent) {
      try {
        const carto = toCartographic(event.endPosition, viewer);
        if (!carto) return;

        positions.splice(1, 1, carto);
        entity.add();

        const distance = haversine(positions[0], positions[1]);
        let converted = ''
        let unit = config.unit

        if (unit === 'm') {
          converted = ranges.format(distance)
        } else if (unit === 'km') {
          converted = ranges.format(distance / 1000)
        } else if (unit === 'mi') {
          converted = ranges.format(distance * 0.000621371)
        }

        helper.update(
          `${converted}${unit}. Click again to finish or press Escape to cancel.`
        );
      } catch {
        resolve(undefined);
        reset();
      }
    }

    /**
     * When the user clicks the second time, resolve the distance that was measured and reset
     * everything for reuse.
     * @param event
     */
    function onLastClick(event: ScreenSpaceEventHandler.PositionedEvent) {
      try {
        const carto = toCartographic(event.position, viewer);
        if (!carto) return;

        const [origin, destination] = positions;
        const distance = haversine(origin, destination);
        const meters = distance
        const kilometers = meters / 1000
        const miles = meters * 0.000621371
        resolve({ origin, destination, meters, kilometers, miles });
        reset();
      } catch {
        resolve(0);
        reset();
      }
    }

    /**
     * Set the cursor and begin listening
     */
    function init() {
      try {
        handler.on("left_click", onFirstClick);
        helper.show();
        setCursor("crosshair", viewer);
      } catch {
        reset();
      }
    }

    init();
  });
}

export default function (viewer: Viewer) {
  Object.defineProperties(Viewer.prototype, {
    measure: {
      value: (config?: MeasureConfig) => measure(viewer, config),
    },
  });
}
