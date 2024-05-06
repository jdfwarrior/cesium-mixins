import { Viewer, ScreenSpaceEventHandler, Event } from "cesium";
import { toCartographic } from "./lib/utils";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";
import { fromLatLon, } from 'utm'
import { forward } from 'mgrs'
import { CartographicDegrees } from "./types";

declare module "cesium" {
  interface Viewer {
    cursor: Event;
  }
}

type CoordinateUnit = 'lla' | 'mgrs' | 'utm'

export default function (
  viewer: Viewer,
  options: { ui: boolean } = { ui: false }
) {
  const emitter = new Event();
  const units: CoordinateUnit[] = ['lla', 'mgrs', 'utm'] as const
  let unit: CoordinateUnit = 'lla'
  let lastPosition: CartographicDegrees | undefined
  const ele = viewer.canvas;
  const handler = new Handler(ele);
  const helper = new Helper({
    position: "topleft",
    icon: "cursor",
    text: "0,0",
  });

  /**
   * Get the position display string based on the current selected unit
   * @returns {string}
   */
  function getPositionForUnit() {
    if (!lastPosition) return '0,0'

    let position = ''
    if (unit === 'lla') position = `${lastPosition.latitude.toFixed(4)}, ${lastPosition.longitude.toFixed(4)}`
    else if (unit === 'mgrs') position = forward([lastPosition.longitude, lastPosition.latitude])
    else if (unit === 'utm') {
      const utm = fromLatLon(lastPosition.latitude, lastPosition.longitude)
      position = `${utm.zoneNum}${utm.zoneLetter} ${~~utm.easting} ${~~utm.northing}`
    }

    return position
  }

  /**
   * Watches for the mouse to move and updates the helper text when it occurs
   * @param event cesium motion event
   */
  function onMove(event: ScreenSpaceEventHandler.MotionEvent) {
    const cartographic = toCartographic(event.endPosition, viewer);
    if (!cartographic) return;

    // @ts-ignore Type error indicates that this should be an array but its not. Example code from Cesium indicates this is correct
    emitter.raiseEvent(cartographic);
    lastPosition = cartographic

    const display = getPositionForUnit()
    helper.update(display);
  }

  /**
   * initialize listeners
   */
  function init() {
    handler.on("mouse_move", onMove);

    if (helper.ele) {
      helper.ele.onclick = () => {
        const index = units.findIndex(current => current === unit)
        unit = units[(index + 1) % units.length]

        const display = getPositionForUnit()
        helper.update(display)
      }

      helper.ele.title = `Click to change coordinate unit`
      helper.ele.style.userSelect = 'none'
      helper.ele.style.cursor = 'pointer'
    }

    helper.show();
  }

  init();

  Object.defineProperties(Viewer.prototype, {
    cursor: { value: emitter },
  });
}
