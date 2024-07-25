import { Viewer, Entity } from "cesium";
import PickEntity from "./pick-entity";
import PickLocation from "./pick-location";
import PickMultiple from "./pick-multiple"
import { CartographicDegrees } from "./types";

declare module "cesium" {
  interface Viewer {
    pick: {
      entity: () => Promise<Entity[]>;
      location: () => Promise<CartographicDegrees | undefined>;
      multiple: () => Promise<Entity[]>
    };
  }
}

export default (viewer: Viewer) => {
  const entity = PickEntity(viewer);
  const location = PickLocation(viewer);
  const multiple = PickMultiple(viewer)

  Object.defineProperties(Viewer.prototype, {
    pick: {
      value: { entity, location, multiple },
      writable: true,
    },
  });
};
