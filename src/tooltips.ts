import { Viewer, ScreenSpaceEventHandler, Entity, Cartesian2 } from "cesium";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";

export default function (viewer: Viewer) {
  const ele = viewer.canvas;
  const handler = new Handler(ele);

  // create a new tooltip, styled so that it is initially hidden and is slightly smaller than the others
  const helper = new Helper({
    styles: { display: "none", fontSize: "12px", lineHeight: "12px" },
  });
  helper.show();

  /**
   * Shows the tooltip at the cursor location (plus an offset) for the provided entity
   * @param entity hovered entity
   * @param at cartesian position of the cursor
   */
  function show(entity: Entity, at: Cartesian2) {
    const { name } = entity;
    const { x, y } = at;

    if (!name) {
      hide();
    } else {
      helper.show()
      const left = x + 20 + "px";
      const top = y - 25 + "px";
      helper.update(name);
      helper.setStyles({ display: "block", top, left });
    }
  }

  /**
   * Hides the tooltip when no entity is hovered or the entity has no name
   */
  function hide() {
    if (helper.isVisible()) helper.hide();
  }

  /**
   * When the mouse moves, check to see if there are any entities under it
   * if there are, show the tooltip with the entity name
   * if not, hide the tooltip
   * @param event mouse move event
   */
  function onMove(event: ScreenSpaceEventHandler.MotionEvent) {
    const position = event.endPosition;
    const hovering = viewer.scene.drillPick(position);
    const [primitive] = hovering;

    if (primitive) {
      const entity = primitive.id;
      show(entity, position);
    } else {
      hide();
    }
  }

  /**
   * initialize listener
   */
  function init() {
    handler.on("mouse_move", onMove);
  }

  init();
}
