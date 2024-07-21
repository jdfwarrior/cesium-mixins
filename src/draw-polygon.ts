import {
  Viewer,
  ScreenSpaceEventHandler,
  CallbackProperty,
  Cartesian3,
  Color,
} from "cesium";
import {
  toCartographic,
  setCursor,
  onEscape,
  disableSelection,
} from "./lib/utils";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";
import { TemporaryEntity } from "./lib/entity";
import { CartographicDegrees, DrawPolygonResult } from "./types";

declare module "cesium" {
  interface Viewer {
    drawpolygon: () => Promise<DrawPolygonResult>;
  }
}

function drawpolygon(viewer: Viewer) {
  return new Promise((resolve) => {
    const ele = viewer.canvas;
    const handler = new Handler(ele);
    const positions: CartographicDegrees[] = [];
    const helper = new Helper(viewer, {
      icon: "cursor-click",
      text: "Click points to draw a polygon or press Escape to cancel",
    });
    const escapeHandler = onEscape(reset);
    const restoreSelection = disableSelection(viewer);

    // create our position callback that will convert our cartographic degrees array
    // into an array of cartesians for rendering the path
    const positionsCallback = new CallbackProperty(() => {
      return positions.map((position) =>
        Cartesian3.fromDegrees(position.longitude, position.latitude)
      );
    }, false);

    // create our temporary entity for rendering
    const entity = new TemporaryEntity(
      {
        polyline: {
          positions: positionsCallback,
          material: Color.CHARTREUSE,
          width: 3,
        },
      },
      viewer
    );

    /**
     * Reset the visualization to new
     * Remove the entity, remove all event handlers, reset the cursor back to the default
     * and clear all of the clicked positions
     */
    function reset() {
      try {
        entity.remove();
        handler.off("left_click");
        handler.off("mouse_move");
        handler.destroy();
        setCursor("default", viewer);
        positions.length = 0;
        escapeHandler();
        helper.hide();
        restoreSelection();
      } catch {
        console.warn(
          `encountered an error attempting to clean up after drawpolygon`
        );
      }
    }

    /**
     * Handler for the first click on the globe. We'll just add the clicked position to the
     * positions array and register the next set of event handlers
     * @param event cesium positioned event
     */
    function onFirstClick(event: ScreenSpaceEventHandler.PositionedEvent) {
      const carto = toCartographic(event.position, viewer);
      if (!carto) return;

      // double push the position so that, when we start moving the cursor afterward,
      // we can splice and replace the last position with the new cursor position
      positions.push(carto, carto);

      handler.off("left_click");

      handler.on("mouse_move", onMove);
      handler.on("left_click", onClick);
    }

    /**
     * calculate the range at which we should be considering it close enough
     * to want to close the polygon. That value should change based on the zoom
     * level of the camera within the visualization. Getting the camera height
     * and dividing by 90 seems to give a pretty comfortable range
     * @returns {number}
     */
    function getCloseEnoughDistance() {
      // calculate the range at which we should be considering it close enough
      // to want to close the polygon. That value should change based on the zoom level
      // of the camera within the visualization. Getting the camera height and dividing by 90
      // seems to give a pretty comfortable range
      const closeEnough = Math.abs(
        ~~viewer.camera.positionCartographic.height / 90
      );

      return closeEnough;
    }

    /**
     * Event handler for when the user clicks a position on the globe. Will add the position to the
     * posisitons array and compute the distance from the current position to the first position
     * to attempt to determine if the user is trying to close the drawn shape.
     * @param event cesium positioned event
     */
    function onClick(event: ScreenSpaceEventHandler.PositionedEvent) {
      try {
        handler.off("mouse_move");
        handler.off("left_click");

        const carto = toCartographic(event.position, viewer);
        if (!carto) return;

        // double push the position so that, when we start moving the cursor afterward,
        // we can splice and replace the last position with the new cursor position
        positions.splice(positions.length - 1, 1, carto, carto);

        // get the first and last (current) position in the array
        const first = positions.at(0);
        const last = positions.at(-1);
        if (!first || !last) return;

        // check to see how far apart those two points are from one another.
        const distance = Cartesian3.distance(
          Cartesian3.fromDegrees(first?.longitude, first?.latitude),
          Cartesian3.fromDegrees(last?.longitude, last?.latitude)
        );

        // get the distance determined to be close enough to consder it being an attempt to close the polygon
        const requiredDistance = getCloseEnoughDistance();

        // if the current distance is less than the required distance on the click, we're assuming that
        // they are trying to close the polygon. At that point, reset. Otherwise, add the handlers back
        // and continue watching for interactions
        if (distance > requiredDistance) {
          handler.on("mouse_move", onMove);
          handler.on("left_click", onClick);
        } else {
          const [origin] = positions;
          positions.splice(positions.length - 2, 2, origin);
          resolve([...positions]);
          reset();
        }
      } catch {
        resolve([]);
        reset();
      }
    }

    /**
     * Event handler for when the user moves their cursor. The position will be added
     * to the array and the entity will be added to the visualization. Then the distance
     * from the origin position will be calculated to determine if the user may be trying
     * to close the polygon. If so, it will change the cursor to let the user know that's
     * what is going to happen. Otherwise, the cursor is set back to the crosshair.
     * @param event cesium motion event
     */
    function onMove(event: ScreenSpaceEventHandler.MotionEvent) {
      try {
        // get the mouse cursor position as a cartographic
        const carto = toCartographic(event.endPosition, viewer);
        if (!carto) return;

        // replace the last position in the array with the new location
        positions.splice(positions.length - 1, 1, carto);

        // add the entity to the visualization if it isn't there already
        entity.add();

        // get the first and last (current) position from the array
        const first = positions.at(0);
        const last = positions.at(-1);
        if (!first || !last) return;

        // see how far they are from one another.
        const distance = Cartesian3.distance(
          Cartesian3.fromDegrees(first?.longitude, first?.latitude),
          Cartesian3.fromDegrees(last?.longitude, last?.latitude)
        );

        // get the distance determined to be close enough to consder it being an attempt to close the polygon
        const requiredDistanceToClose = getCloseEnoughDistance();

        // if the distance between the points is less than the distance that we've determined
        // to be close enough, change the cusor accordingly.
        if (distance < requiredDistanceToClose) {
          setCursor("cell", viewer);
        } else {
          setCursor("crosshair", viewer);
        }
      } catch {
        resolve([]);
        reset();
      }
    }

    /**
     * Initialize event handlers and set the cursor
     */
    function init() {
      handler.on("left_click", onFirstClick);
      setCursor("crosshair", viewer);
      helper.show();
    }

    init();
  });
}

export default function (viewer: Viewer) {
  Object.defineProperties(Viewer.prototype, {
    drawpolygon: {
      value: () => drawpolygon(viewer),
      writable: true
    },
  });
}
