import { Viewer, Entity } from "cesium";
import PickEntity from "./pick-entity";
import PickLocation from "./pick-location";
import { CartographicDegrees } from "./types";

declare module "cesium" {
  interface Viewer {
    pick: {
      entity: () => Promise<Entity[]>;
      location: () => Promise<CartographicDegrees | undefined>;
    };
  }
}

export default (viewer: Viewer) => {
  const entity = PickEntity(viewer);
  const location = PickLocation(viewer);

  Object.defineProperties(Viewer.prototype, {
    pick: {
      value: { entity, location },
      writable: true,
    },
  });
};
