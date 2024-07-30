import {
  Viewer,
  TileMapServiceImageryProvider,
  WebMapServiceImageryProvider,
  UrlTemplateImageryProvider,
  Event,
  type ImageryLayer,
  type ImageryProvider,
} from "cesium";

class MapManager {
  private viewer: Viewer;
  providers: ImageryLayer[] = [];
  providerAdded = new Event();
  providerRemoved = new Event();
  providerToggled = new Event();

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  /**
   * Tests whether or not the provided url is supposedly the url of a wms server
   * @param {string} url url to test
   * @returns {boolean}
   */
  private isWms(url: string): boolean {
    return (
      /service=wms/i.test(url) ||
      /request=getcapabilities/i.test(url) ||
      /layers=[0-9]+/i.test(url) ||
      url.includes("geoserver") ||
      url.includes("mapserver") ||
      url.includes("arcgis") ||
      url.includes("ows") ||
      url.includes("wms")
    );
  }

  private testWms(url: string) {
    const withParams = `${url}?service=wms&request=getcapabilities`;
    const result = fetch(withParams);
    // determine whether or not its xml data
    return true;
  }

  /**
   * Tests whether or not the provided url is a template based url
   * @param {string} url url to test
   * @returns {boolean}
   */
  private isTemplate(url: string): boolean {
    return /(\{[xyz]\}\/?){3,}/i.test(url);
  }

  /**
   * Tests whether or not the provided url is supposedly the url of a tms server
   * @param {string} url url to test
   * @returns {boolean}
   */
  private isTms(url: string) {
    return /(tms|tile|tiles)/.test(url);
  }

  async create(name: string, url: string) {
    const iswms = this.isWms(url);
    const istemplate = this.isTemplate(url);
    // const istms = this.isTms(url);

    let provider: ImageryProvider;

    if (iswms) {
      const options = {
        url: url,
        parameters: {
          transparent: true,
          REQUEST: "GetMap",
          Service: "WMS",
          Version: "1.3.0",
          FORMAT: "image/png",
          CRS: "CRS:84",
        },
        layers: "0",
      };

      provider = new WebMapServiceImageryProvider(options);
    } else if (istemplate) {
      const options = { url };
      provider = new UrlTemplateImageryProvider(options);
    } else {
      provider = await TileMapServiceImageryProvider.fromUrl(url);
    }

    const layer = this.viewer.imageryLayers.addImageryProvider(provider);
    this.providerAdded.raiseEvent([layer, this.providers]);
    this.providers.push(layer);
  }

  /**
   * Remove the specified imagery layer
   * @param {ImageryLayer} layer imagery layer to remove
   */
  remove(layer: ImageryLayer) {
    const index = this.providers.findIndex((i) => i === layer);
    if (index >= 0) {
      this.providers.splice(index, 1);
      this.viewer.imageryLayers.remove(layer);
      this.providerRemoved.raiseEvent([layer, this.providers]);
    }
  }

  get(layer: ImageryLayer) {
    return this.providers.find((i) => i === layer);
  }

  toggle(layer: ImageryLayer) {
    const imagerylayer = this.get(layer);
    if (!imagerylayer) return;
    imagerylayer.show = !imagerylayer.show;
    this.providerToggled.raiseEvent([imagerylayer]);
  }

  show(layer: ImageryLayer) {
    const imagerylayer = this.get(layer);
    if (!imagerylayer) return;
    imagerylayer.show = true;
    this.providerToggled.raiseEvent([imagerylayer]);
  }

  hide(layer: ImageryLayer) {
    const imagerylayer = this.get(layer);
    if (!imagerylayer) return;
    imagerylayer.show = false;
    this.providerToggled.raiseEvent([imagerylayer]);
  }

  raise(layer: ImageryLayer) {
    const imagerylayer = this.get(layer);
    if (!imagerylayer) return;
    this.viewer.imageryLayers.raise(imagerylayer);
  }

  lower(layer: ImageryLayer) {
    const imagerylayer = this.get(layer);
    if (!imagerylayer) return;
    this.viewer.imageryLayers.lower(imagerylayer);
  }
}

export default (viewer: Viewer) => {
  const manager = new MapManager(viewer);

  Object.defineProperties(Viewer.prototype, {
    maps: {
      value: manager,
      writable: true,
      enumerable: true,
    },
  });
};
