import { Viewer } from 'cesium'
import DrawCircle from './draw-circle'
import DrawPolygon from './draw-polygon'
import { DrawCircleResult, DrawPolygonResult } from './types'

declare module 'cesium' {
    interface Viewer {
        draw: {
            circle: () => Promise<DrawCircleResult>;
            polygon: () => Promise<DrawPolygonResult>
        }
    }
}

export default (viewer: Viewer) => {
    const circle = DrawCircle(viewer)
    const polygon = DrawPolygon(viewer)

    Object.defineProperties(Viewer.prototype, {
        draw: {
            value: { circle, polygon },
            writable: true
        }
    })
}