import { Event } from "cesium";
import { Viewer, Cartesian3, Camera } from "cesium";
import { uid } from "uid";

class SavedView {
  readonly id: string = uid();
  name: string = "";
  position: Cartesian3 = new Cartesian3();
  direction: Cartesian3 = new Cartesian3();
  up: Cartesian3 = new Cartesian3();
  right: Cartesian3 = new Cartesian3();

  constructor(camera?: Camera) {
    if (!camera) return;

    this.position = camera.position.clone();
    this.direction = camera.direction.clone();
    this.up = camera.up.clone();
    this.right = camera.right.clone();
  }

  /**
   * Create a new SavedView instance from the values that compose a camera
   * without having to pass an actual camera instance
   * @param {Cartesian3} position camera position
   * @param {Cartesian3} direction camera direction
   * @param {Cartesian3} up camera up
   * @param {Cartesian3} right camera right
   * @returns
   */
  static fromElements(
    position: Cartesian3,
    direction: Cartesian3,
    up: Cartesian3,
    right: Cartesian3
  ) {
    const instance = new this();
    instance.position = position;
    instance.direction = direction;
    instance.up = up;
    instance.right = right;
    return instance;
  }
}

const position = new Cartesian3(
  2091972.2394611237,
  -17107925.66536708,
  10397697.575489834
);
const direction = new Cartesian3(
  -0.10389044085527112,
  0.8496049354613019,
  -0.5170862886779095
);
const up = new Cartesian3(
  -0.06276227844352736,
  0.5132632135106426,
  0.855933274304315
);
const right = new Cartesian3(
  0.9926065044636141,
  0.12137679883950414,
  3.504141421473151e-15
);

// Create the default home view for the application
const homeView = SavedView.fromElements(position, direction, up, right);

class SavedViewCollection {
  defaultHome: SavedView = homeView;
  values: SavedView[] = [];
  collectionChanged: Event = new Event();
  onToggle: Event = new Event()
  active: SavedView | undefined;
  userHome: SavedView | undefined;

  constructor(public viewer: Viewer, options: SavedViewsOptions) {
    this.registerKeyListeners();
    this.values.push(this.defaultHome);
    this.goto(this.defaultHome);

    if (options.showToggle) {
      const homeButton = document.querySelector('.cesium-home-button')
      if (!homeButton) return

      const canvas = viewer.canvas
      const viewerEle = document.querySelector('.cesium-viewer')
      const rect = homeButton.getBoundingClientRect()

      const top = rect.bottom + 3
      const right = canvas.clientWidth - rect.right - 1

      const viewListButton = document.createElement('button')
      viewListButton.style.position = 'fixed'
      viewListButton.style.top = `${top}px`
      viewListButton.style.right = `${right}px`
      viewListButton.style.backgroundColor = `rgba(49, 51, 54, 0.8)`
      viewListButton.style.border = `1px solid rgb(68, 68, 68)`
      viewListButton.style.borderRadius = `6px`
      viewListButton.style.color = `rgb(237, 255, 255)`
      viewListButton.style.padding = `0px 8px`
      viewListButton.style.width = `34px`
      viewListButton.style.display = `flex`
      viewListButton.style.justifyContent = `center`
      viewListButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6l-6-6z"/></svg>`
      viewListButton.onclick = () => this.onToggle.raiseEvent()

      viewerEle?.appendChild(viewListButton)
    }
  }

  /**
   * register event listeners for keybinding to navigate through the saved views
   */
  registerKeyListeners() {
    document.addEventListener("keydown", (event: KeyboardEvent) => {
      const ctrl = event.ctrlKey;
      const shift = event.shiftKey;
      const key = event.key.toLowerCase();

      if (!ctrl || !shift) return;

      if (key === "l") {
        event.preventDefault();
        event.stopPropagation();
        this.add();
        console.log(`Saved new camera location`);
      } else if (key === "j") {
        // prev
        event.preventDefault();
        event.stopPropagation();
        this.previousView();
      } else if (key === "k") {
        // next
        event.preventDefault();
        event.stopPropagation();
        this.nextView();
      } else if (key === "h") {
        // home
        event.preventDefault();
        event.stopPropagation();
        this.home();
      }
    });
  }

  /**
   * add a new saved view to the collection by capturing the current camera view
   * and caching it to the collection
   */
  add() {
    try {
      const view = new SavedView(this.viewer.camera);
      this.values.push(view);

      this.collectionChanged.raiseEvent();
    } catch {
      throw new Error(`Error capturing camera view`);
    }
  }

  /**
   * gets the SavedView that matches the provided id string
   * @param {string} id id of the saved view
   * @returns {SavedView}
   */
  getById(id: string) {
    const index = this.values.findIndex((ele) => ele.id === id);
    return this.values.at(index);
  }

  /**
   * remove specified saved view from the collection
   * @param {SavedView} view the view to remove
   */
  remove(view: SavedView) {
    const index = this.values.findIndex((ele) => ele === view);
    if (index < 0) return;
    this.values.splice(index, 1);

    this.collectionChanged.raiseEvent();
  }

  /**
   * remove the saved view with the matching id string
   * @param {string} id id of the saved view to remove
   */
  removeById(id: string) {
    const index = this.values.findIndex((ele) => ele.id === id);
    if (index < 0) return;
    const view = this.values.at(index);
    if (!view) return;
    this.remove(view);

    this.collectionChanged.raiseEvent();
  }

  /**
   * remove all saved views
   */
  removeAll() {
    this.values.length = 0;

    this.collectionChanged.raiseEvent();
  }

  /**
   * fly to the provided saved view
   * @param {SavedView} view the view to fly to
   */
  goto(view: SavedView) {
    this.viewer.camera.flyTo({
      destination: view.position.clone(),
      orientation: {
        direction: view.direction.clone(),
        up: view.up.clone(),
        right: view.right.clone(),
      },
    });
    this.active = view;
  }

  /**
   * fly to the home view
   */
  home() {
    // get the user selected home view if it has been set, otherwise
    // fall back to the default home view
    const home = this.userHome ?? this.defaultHome;
    this.goto(home);
  }

  /**
   * go to the preview view in the collection
   */
  previousView() {
    let view: SavedView | undefined;
    const index = this.values.findIndex((ele) => ele === this.active);
    if (!index) view = this.values.at(-1);
    else view = this.values.at(index - 1);

    if (view) this.goto(view);
    else this.goto(this.defaultHome);
  }

  /**
   * go to the next view in the collection
   */
  nextView() {
    let view: SavedView | undefined;
    const index = this.values.findIndex((ele) => ele === this.active);
    const len = this.values.length;
    view = this.values.at((index + 1) % len);

    if (view) this.goto(view);
    else this.goto(this.defaultHome);
  }

  /**
   * set the provided saved view as the home view
   */
  setHome(view: SavedView) {
    this.userHome = view;
  }

  /**
   * reset the user selected home view
   */
  resetHome() {
    this.userHome = undefined;
  }
}

interface SavedViewsOptions {
  showToggle: boolean
}

export default function (viewer: Viewer, options: SavedViewsOptions = { showToggle: false }) {
  const collection = new SavedViewCollection(viewer, options);

  Object.defineProperties(Viewer.prototype, {
    views: {
      value: collection,
      writable: true
    },
  });
}
