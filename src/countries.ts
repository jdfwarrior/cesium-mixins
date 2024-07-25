import { Viewer } from "cesium";
import { CountryLabels } from "./countries-labels";
import { CountryBorders } from "./countries-borders";

declare module "cesium" {
  interface Viewer {
    countries: {
      labels: CountryLabels;
      borders: CountryBorders;
    };
  }
}

export default (viewer: Viewer) => {
  const labels = new CountryLabels(viewer);
  const borders = new CountryBorders(viewer);

  Object.defineProperties(Viewer.prototype, {
    countries: {
      value: {
        labels,
        borders,
      },
      writable: true,
    },
  });
};
