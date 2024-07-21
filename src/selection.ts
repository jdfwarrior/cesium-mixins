import {
  Viewer,
  ScreenSpaceEventHandler,
  Cartographic,
  Math as CMath,
  Entity,
  Rectangle,
  CallbackProperty,
  Color,
} from "cesium";

import { toCartographic, isBetween, onEscape, setCursor } from "./lib/utils";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";
import { TemporaryEntity } from "./lib/entity";

declare module "cesium" {
  interface Viewer {
    select: () => Promise<Entity[]>;
  }
}

function select(viewer: Viewer) {
  return new Promise((resolve) => {
    const ele = viewer.canvas;
    const handler = new Handler(ele);
    const positions: number[] = [];
    setCursor("crosshair", viewer);

    const helper = new Helper(viewer, {
      icon: "cursor-square",
      text: "Click to set the starting corner of the selection or press Escape to cancel",
    });
    const removeEscapeListener = onEscape(reset);

    const rectangleCallback = new CallbackProperty(() => {
      try {
        // desstructure values from the positions array
        const [_west, _south, _east, _north] = positions;
        // set north to the max value because it should always be greater than the south value
        const north = Math.max(_north, _south);
        const south = Math.min(_north, _south);

        // initalize the values at min/max which works fine
        // unless you cross the idl
        let east = Math.max(_east, _west);
        let west = Math.min(_east, _west);

        // near idl
        // at the international date line, you need to flip
        // these values to prevent it from wrapping around the
        // back side of the globe
        if (east - west > 180) {
          east = Math.min(_east, _west);
          west = Math.max(_east, _west);
        }

        return Rectangle.fromDegrees(west, south, east, north);
      } catch {
        return Rectangle.fromDegrees(0, 0, 0, 0);
      }
    }, false);

    const entity = new TemporaryEntity(
      {
        rectangle: {
          coordinates: rectangleCallback,
          material: Color.CHARTREUSE.withAlpha(0.4),
        },
      },
      viewer
    );

    /**
     * Returns an array of all entities in all datasources within the current Cesium instance
     * @returns {Entity[]}
     */
    function getAllEnities() {
      const entities: Entity[] = [...viewer.entities.values];

      try {
        const count = viewer.dataSources.length;
        let inc = 0;
        while (inc < count) {
          const source = viewer.dataSources.get(inc);
          entities.push(...source.entities.values);
          inc++;
        }
      } catch {
      } finally {
        return entities;
      }
    }

    /**
     * Filter function that returns boolean whether or not the provided entity is within
     * the currently selected rectangular coordinates
     * @param entity
     */
    function inRect(entity: Entity) {
      const clock = viewer.clock;
      const currentTime = clock.currentTime;
      const position = entity.position?.getValue(currentTime);
      if (!position) return false;

      const [_west, _south, _east, _north] = positions;
      // set north to the max value because it should always be greater than the south value
      const north = Math.max(_north, _south);
      const south = Math.min(_north, _south);

      // initalize the values at min/max which works fine
      // unless you cross the idl
      let east = Math.max(_east, _west);
      let west = Math.min(_east, _west);

      // at the international date line, you need to flip
      // these values to prevent it from wrapping around the
      // back side of the globe
      const atIDL = east - west > 180;

      // near idl
      if (atIDL) {
        east = Math.min(_east, _west);
        west = Math.max(_east, _west);
      }

      // TODO: See if we actually need this part or can it be replaced with a call to
      // the current toCartographic function
      const carto = Cartographic.fromCartesian(position);
      const latitude = CMath.toDegrees(carto.latitude);
      const longitude = CMath.toDegrees(carto.longitude);

      if (
        !atIDL &&
        isBetween(latitude, south, north) &&
        isBetween(longitude, west, east)
      ) {
        return true;
      } else if (
        atIDL &&
        isBetween(latitude, south, north) &&
        (isBetween(longitude, west, 180) || isBetween(longitude, -180, east))
      ) {
        return true;
      } else {
        return false;
      }
    }

    /**
     * Resets the plugin by clearing the cached rectangle positions,
     * removing the recangle entity, resetting the cursor and destroying the
     * screen space event handler
     */
    function reset() {
      try {
        handler.destroy();
        entity.remove();
        positions.length = 0;
        setCursor("default", viewer);
        helper.hide();
        removeEscapeListener();
      } catch { }
    }

    /**
     * Listens for a click to start/stop drawing the selection rectangle
     * @param event cesium positioned event
     */
    function onFirstClick(event: ScreenSpaceEventHandler.PositionedEvent) {
      try {
        const cartographic = toCartographic(event.position, viewer);
        if (!cartographic) return;

        const { latitude, longitude } = cartographic;

        positions.push(longitude, latitude);
        handler.on("mouse_move", onMove);
        helper.update(
          `Now click again to set the position of opposite corner or press Escape to cancel.`
        );
      } catch {
        resolve([]);
        reset();
      }
    }

    /**
     * Listens for the final click to close off the selection and determine what entities are within
     * @param event cesium positioned event
     */
    function onFinalClick(event: ScreenSpaceEventHandler.PositionedEvent) {
      try {
        const cartographic = toCartographic(event.position, viewer);
        if (!cartographic) return;

        const { latitude, longitude } = cartographic;
        positions.splice(2, 2, longitude, latitude);

        const entities = getAllEnities();
        const selected = entities
          .filter((entity) => entity.show)
          .filter(inRect);

        resolve(selected);
        reset();
      } catch {
        resolve([]);
        reset();
      }
    }

    /**
     * Listens for the mouse to move and will replace the last position with this new position
     * to make drawing the rectangle be interactive
     * @param event cesium mouse move event
     */
    function onMove(event: ScreenSpaceEventHandler.MotionEvent) {
      try {
        const cartographic = toCartographic(event.endPosition, viewer);
        if (!cartographic) return;

        const { latitude, longitude } = cartographic;
        positions.splice(2, 2, longitude, latitude);

        entity.add();

        handler.on("left_click", onFinalClick);
      } catch (err) {
        console.log(err);
        resolve([]);
        reset();
      }
    }

    /**
     * Init function to setup listeners and add helper ui to the display
     */
    function init() {
      handler.on("left_click", onFirstClick);
      helper.show();
    }

    init();
  });
}

export default function (viewer: Viewer) {
  Object.defineProperties(Viewer.prototype, {
    select: {
      value: () => select(viewer),
      writable: true
    },
  });
}
