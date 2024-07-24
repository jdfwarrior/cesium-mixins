import { Viewer, CzmlDataSource, Event, Color } from "cesium";
import { CountriesList } from "./lib/countries.data";
import { geo } from "./lib/countries.geo";
import { GeoJsonDataSource } from "cesium";

declare module "cesium" {
  interface Viewer {
    countries: {
      labels: CountryLabels;
      borders: CountryBorders;
    };
  }
}

class CountryLabels {
  enabled: boolean = false;
  sourceName: string = "mixins:countries";
  onChanged: Event = new Event();
  constructor(public viewer: Viewer) {}

  /**
   * Returns an array of all datasources currently available within the view
   * @returns {DataSource[]}
   */
  private _getDataSoruces() {
    const sources = [];
    let i = 0;
    const len = this.viewer.dataSources.length;
    while (i < len) {
      const source = this.viewer.dataSources.get(i);
      sources.push(source);
      i++;
    }
    return sources;
  }

  /**
   * Creates a new CzmlDataSource for the labels if it doesn't exist. If it does exist,
   * returns that instance of the CzmlDataSource
   * @returns {CzmlDataSource}
   */
  private _getOrCreateLabelsSource(): CzmlDataSource {
    const sources = this._getDataSoruces();
    const source = sources.find(
      (s) => s.name === this.sourceName
    ) as CzmlDataSource;

    if (source) return source;
    else {
      const source = new CzmlDataSource(this.sourceName);
      source.process({ id: "document", version: "1.0" });
      this.viewer.dataSources.add(source);
      return source;
    }
  }

  /**
   * Load the CzmlDataSource with an array of labels to represent all countries
   */
  show() {
    // get or create the data source
    const source = this._getOrCreateLabelsSource();

    // generate all the czml labels for the countries
    const labels = CountriesList.map((country) => ({
      id: `country:${country.iso}`,
      name: `${country.name} (${country.iso})`,
      label: {
        text: `${country.name} (${country.iso})`,
        scale: { number: 1 },
        showBackground: { boolean: true },
        font: { font: "Helvetica 12px" },
        translucencyByDistance: { nearFarScalar: [500000, 0.5, 9000000, 1] },
        distanceDisplayCondition: {
          distanceDisplayCondition: [250000, 12000000],
        },
      },
      position: {
        cartographicDegrees: [+country.longitude, +country.latitude, 0],
      },
    }));

    // process those czml packets
    source.process(labels);

    this.enabled = true;
    this.onChanged.raiseEvent();
  }

  /**
   * Remove the czml data source from the viewer
   */
  hide() {
    // get the source
    const source = this._getOrCreateLabelsSource();
    // remove it from the viewer
    this.viewer.dataSources.remove(source);

    this.enabled = false;
    this.onChanged.raiseEvent();
  }
}

class CountryBorders {
  sourceName = "mixins:countryborders";
  source: GeoJsonDataSource | undefined;
  visible: boolean = false;

  constructor(public viewer: Viewer) {}

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
