import { Viewer, CzmlDataSource } from "cesium";
import { CountriesList } from "./lib/countries";

class Countries {
  sourceName: string = "mixins:countries";
  constructor(public viewer: Viewer) {}

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

  private _getOrCreateLabelsSource(): CzmlDataSource {
    const sources = this._getDataSoruces();
    const source = sources.find(
      (s) => s.name === this.sourceName
    ) as CzmlDataSource;

    if (source) return source;
    else {
      const source = new CzmlDataSource(this.sourceName);
      return source;
    }
  }

  showLabels() {
    const source = this._getOrCreateLabelsSource();
    const labels = CountriesList.map((country) => ({
      id: `country:${country.iso}`,
      name: `${country.emoji} ${country.name}`,
      label: {
        scale: { number: 1 },
        showBackground: { boolean: false },
        font: { font: "Helvetica 12px" },
      },
    }));

    source.process(labels);
  }

  hideLabels() {
    const source = this._getOrCreateLabelsSource();
    this.viewer.dataSources.remove(source);
  }
}

export default (viewer: Viewer) => {
  const countries = new Countries(viewer);

  Object.defineProperties(Viewer.prototype, {
    countries: {
      value: countries,
      writable: true,
    },
  });
};
