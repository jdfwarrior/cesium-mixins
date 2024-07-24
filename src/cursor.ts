import { Viewer, ScreenSpaceEventHandler } from "cesium";
import { toCartographic } from "./lib/utils";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";
import { fromLatLon } from "utm";
import { forward } from "mgrs";
import { CartographicDegrees } from "./types";

declare module "cesium" {
  interface Viewer {
    mousecursor: MouseCursorTracker
  }
}

type CoordinateUnit = "lla" | "mgrs" | "utm";

class UnitConverter {
  private _conversions: Map<CoordinateUnit | string, (latitude: number, longitude: number) => string> = new Map()
  unit: string = 'lla'
  show: boolean = false

  constructor() {
    this._conversions.set('lla', this._toLLA.bind(this))
    this._conversions.set('mgrs', this._toMGRS.bind(this))
    this._conversions.set('utm', this._toUTM.bind(this))
    this._conversions.set('dms', this._toDMS.bind(this))
  }

  /**
   * Create the dispay string for the LLA unit
   * @param latitude 
   * @param longitude 
   * @returns {string}
   */
  private _toLLA(latitude: number, longitude: number) {
    return `${this.show ? 'Lat, Lon: ' : ''}${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  /**
   * Create the display string for the MGRS unit
   * @param latitude 
   * @param longitude 
   * @returns {string}
   */
  private _toMGRS(latitude: number, longitude: number) {
    return `${this.show ? "MGRS: " : ""}${forward([longitude, latitude])}`;
  }

  /**
   * Create the display string for the UTM unit
   * @param latitude 
   * @param longitude 
   * @returns {string}
   */
  private _toUTM(latitude: number, longitude: number) {
    const utm = fromLatLon(latitude, longitude);
    return `${this.show ? "UTM: " : ""}${utm.zoneNum}${utm.zoneLetter} ${~~utm.easting} ${~~utm.northing}`;
  }

  /**
   * Create the display string for the degrees minutes seconds unit
   * @param latitude 
   * @param longitude 
   * @returns {string}
   */
  private _toDMS(latitude: number, longitude: number) {
    const lat = this._decimalToDMS(latitude)
    const lon = this._decimalToDMS(longitude)

    return `${this.show ? 'DMS: ' : ''}${lat.degrees}° ${lat.minutes}' ${lat.seconds}, ${lon.degrees}° ${lon.minutes}' ${lon.seconds}`
  }

  /**
   * Converts the provided value from decimal degrees to degrees, minutes, and seconds
   * @param decimalDegrees 
   * @returns {degrees: number, minutes: number, seconds: number}
   */
  private _decimalToDMS(decimalDegrees: number) {
    const isPositive = decimalDegrees >= 0;
    decimalDegrees = Math.abs(decimalDegrees);
    const degrees = Math.floor(decimalDegrees);
    const decimalMinutes = (decimalDegrees - degrees) * 60;
    const minutes = Math.floor(decimalMinutes);
    const seconds = ((decimalMinutes - minutes) * 60).toFixed(2);

    return {
      degrees: isPositive ? degrees : -degrees,
      minutes: minutes,
      seconds: seconds
    };
  }

  /**
  * Add a new unit to the conversions map
  * @param {string} unit the string version of the unit
  * @param {function} converter the function to convert the lla position to the desired unit
  */
  add(unit: string, converter: (latitude: number, longitude: number) => string) {
    this._conversions.set(unit, converter)
  }

  /**
   * Remove the specified unit conversion
   * @param unit 
   */
  remove(unit: string) {
    this._conversions.delete(unit)
  }

  /**
   * Set the current display unit to the provided unit
   * @param {string} unit 
   */
  set(unit: string) {
    this.unit = unit
  }

  /**
   * Get the converter for the specified unit
   * @param unit 
   * @returns {(latitude: number, longitude: number) => string | undefined}
   */
  get(unit: string) {
    return this._conversions.get(unit)
  }

  /**
   * Iterates to the next display unit in the collection
   */
  next() {
    const units = Array.from(this._conversions.keys())
    let index = units.findIndex(unit => unit === this.unit)
    if (index < 0) index = 0
    else index++
    const unit = units.at(index) ?? 'lla'
    this.set(unit)
  }

  /**
   * Iterates to the previous display unit in the collection
   */
  previous() {
    const units = Array.from(this._conversions.keys())
    let index = units.findIndex(unit => unit === this.unit)
    if (index < 0) index = 0
    else index--
    const unit = units.at(index) ?? 'lla'
    this.set(unit)
  }

  /**
   * Clear all unit conversions
   * @note Be careful with this one, this will remove all available conversions
   */
  clear() {
    this._conversions.clear()
  }
}

class MouseCursorTracker {
  private viewer: Viewer
  private lastPosition: CartographicDegrees | undefined;
  private ele: HTMLCanvasElement
  private handler: Handler
  private helper: Helper
  units: UnitConverter

  constructor(viewer: Viewer) {
    this.viewer = viewer
    this.ele = this.viewer.canvas;
    this.handler = new Handler(this.ele);
    this.helper = new Helper(this.viewer, {
      position: "topleft",
      icon: "cursor",
      text: "0,0",
    });
    this.units = new UnitConverter()


    this.handler.on("mouse_move", (event: ScreenSpaceEventHandler.MotionEvent) => this.onMove(event));

    if (this.helper.ele) {
      this.helper.ele.onclick = () => {
        this.units.next()
        const display = this.getPositionForUnit();
        this.helper.update(display);
      };

      this.helper.ele.title = `Click to change coordinate unit`;
      this.helper.ele.style.userSelect = "none";
      this.helper.ele.style.cursor = "pointer";
    }
  }


  /**
   * Get the position display string based on the current selected unit
   * @returns {string}
   */
  private getPositionForUnit() {
    if (!this.lastPosition) return "0,0";

    // get the converter for the current designated unit
    const converter = this.units.get(this.units.unit)
    // if a converter isn't found for that unit, return the default string
    if (!converter) return "0,0";

    // else return the output of the converter
    return converter(this.lastPosition.latitude, this.lastPosition.longitude)
  }

  /**
   * Watches for the mouse to move and updates the helper text when it occurs
   * @param event cesium motion event
   */
  private onMove(event: ScreenSpaceEventHandler.MotionEvent) {
    const cartographic = toCartographic(event.endPosition, this.viewer);
    if (!cartographic) return;

    this.lastPosition = cartographic;

    const display = this.getPositionForUnit();
    this.helper.update(display);
  }

  /**
   * Show the mouse cursor location
   */
  show() {
    this.helper.show()
  }

  /**
   * Hide the mouse cursor location
   */
  hide() {
    this.helper.hide()
  }
}


export default function (
  viewer: Viewer,
) {
  const mct = new MouseCursorTracker(viewer)

  Object.defineProperties(Viewer.prototype, {
    mousecursor: {
      value: mct,
      writable: true
    }
  })
}