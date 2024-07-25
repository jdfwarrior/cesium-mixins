import { Viewer, Color } from "cesium";
import { geo } from "./lib/countries.geo";
import { GeoJsonDataSource } from "cesium";

export class CountryBorders {
  sourceName = "mixins:countryborders";
  source: GeoJsonDataSource | undefined;
  visible: boolean = false;

  constructor(public viewer: Viewer) {
    this.viewer.selectedEntityChanged.addEventListener(() => {
      const selected = this.viewer.selectedEntity;
      if (!selected) return;
      if (this.source?.entities.contains(selected))
        this.viewer.selectedEntity = undefined;
    });
  }

  /**
   * Load country borders and show them on the globe
   */
  show() {
    if (!this.source) {
      this.source = new GeoJsonDataSource(this.sourceName);
      this.source.load(geo, {
        fill: Color.YELLOW.withAlpha(0.0),
        stroke: Color.WHITE,
      });
    }

    this.viewer.dataSources.add(this.source);
    this.visible = true;
  }

  /**
   * Hide country borders on the globe
   */
  hide() {
    if (!this.source) return;
    this.viewer.dataSources.remove(this.source);
    this.visible = false;
  }

  /**
   * Toggle the country borders on the globe
   */
  toggle() {
    if (this.visible) this.hide();
    else this.show();
  }
}
