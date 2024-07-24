import { Viewer, ScreenSpaceEventHandler, Entity } from "cesium";
import { onEscape } from "./lib/utils";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";

class PickEntity {
  private viewer: Viewer;
  private ele: HTMLCanvasElement;
  private handler: Handler;
  private helper: Helper;
  private resolver: (entities: Entity[]) => void;
  private cleanup: () => void;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.ele = viewer.canvas;
    this.handler = new Handler(this.ele);
    this.resolver = () => {};

    this.helper = new Helper(viewer, {
      text: "Select an entity or press Escape to cancel.",
      icon: "cursor-click",
    });

    this.cleanup = onEscape(() => {
      this.resolver([]);
      this.reset();
    });
  }

  pick() {
    return new Promise((resolve) => {
      this.resolver = resolve;
      this.handler.on(
        "left_click",
        (event: ScreenSpaceEventHandler.PositionedEvent) => this.onClick(event)
      );
      this.helper.show();
    });
  }

  /**
   * Removes all event listeners and destroys the screen space event handler
   */
  reset() {
    try {
      this.handler.destroy();
      this.helper.hide();
      this.cleanup();
    } catch {
      console.warn(
        `encountered an error attempting to clean up after pickentity`
      );
    }
  }

  /**
   * Handler for when the user clicks the left mouse button,
   * converts the cartesian2 position that they clicked into a
   * cartographic degrees representation and resolves that value back out
   * @param event the left click event from cesium
   */
  onClick(event: ScreenSpaceEventHandler.PositionedEvent) {
    const primitives = this.viewer.scene.drillPick(event.position, 1);
    const entities = primitives.map((primitive) => primitive.id);
    // reset handlers and listeners
    this.reset();
    this.resolver(entities);
  }
}

export default (viewer: Viewer) => {
  const item = new PickEntity(viewer);
  return async () => await item.pick();
};
