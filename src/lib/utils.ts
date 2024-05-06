import {
  Math as math,
  Cartographic,
  Cartesian2,
  Viewer,
} from "cesium";
import type {
  CartographicDegrees,
  Cursor,
} from "../types";

/**
 * Converts a provided cartesian2 position to a cartographic
 * @param {Cartesian2} cartesian value to convert to a cartographic/lla
 * @param {Viewer} viewer the viewer instance
 * @returns {CartographicDegrees}
 */
export function toCartographic(
  cartesian: Cartesian2,
  viewer: Viewer
): CartographicDegrees | undefined {
  try {
    const cartesian3 = viewer.camera.pickEllipsoid(cartesian);
    if (!cartesian3) return undefined;
    const cartographic = Cartographic.fromCartesian(cartesian3);

    const { latitude, longitude, height } = cartographic;
    const result: CartographicDegrees = {
      latitude: math.toDegrees(latitude),
      longitude: math.toDegrees(longitude),
      altitude: height,
    };

    return result;
  } catch {
    return undefined;
  }
}

/**
 * Returns boolean whether or not the provided value is between the min/max values
 * @param value
 * @param min
 * @param max
 * @returns {boolean}
 */
export function isBetween(value: number, min: number, max: number) {
  const minimum = Math.min(min, max);
  const maximum = Math.max(min, max);
  return minimum <= value && value <= maximum;
}

/**
 * Calculates the range between the two points in meters
 * @param loc1 cartographic location
 * @param loc2 cartographic location
 * @returns {number}
 */
export function haversine(
  loc1: CartographicDegrees,
  loc2: CartographicDegrees
) {
  const { latitude: lat1, longitude: lon1 } = loc1;
  const { latitude: lat2, longitude: lon2 } = loc2;

  var R = 6371000; // m
  //has a problem with the .toRad() method below.
  var x1 = lat2 - lat1;
  var dLat = math.toRadians(x1);
  var x2 = lon2 - lon1;
  var dLon = math.toRadians(x2);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(math.toRadians(lat1)) *
    Math.cos(math.toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  return d;
}

/**
 * Set the desired cursor of the cesium viewer
 * @param {Cursor} cursor desired mouse cursor
 * @param {Viewer} viewer cesium viewer instance
 */
export function setCursor(cursor: Cursor, viewer: Viewer) {
  const ele = viewer.canvas;
  ele.style.cursor = cursor;
}

/**
 * Number formatter. Displays at most 3 decimal places and adds comma separator
 */
export const ranges = new Intl.NumberFormat("en-us", {
  maximumFractionDigits: 3,
});

/**
 * Register an event handler for when the user presses the Escape key
 * Returns a function that will cancel the event listener
 * @param fn callback function
 * @returns () => void
 */
export function onEscape(fn: () => void) {
  let destroyed: boolean = false

  function handler(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (destroyed) return

      destroyed = true
      fn();
      remove();
    }
  }

  function remove() {
    try {
      document.body.removeEventListener("keydown", handler);
    } catch { }
  }

  document.addEventListener("keydown", handler);

  return remove;
}

/**
 * Adds an event listener that will clear any selected entity when the selected entity changes
 * and will return a function to restore the selection capability
 * @param viewer viewer instance
 * @returns () => void
 */
export function disableSelection(viewer: Viewer) {
  const preventSelect = () => { viewer.selectedEntity = undefined }
  viewer.selectedEntityChanged.addEventListener(preventSelect)

  const restore = () => {
    viewer.selectedEntityChanged.removeEventListener(preventSelect)
  }

  return restore
}
