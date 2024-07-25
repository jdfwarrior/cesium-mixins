import {
    Viewer,
    ScreenSpaceEventHandler,
    Cartographic,
    Math as CMath,
    Entity,
    Rectangle,
    CallbackProperty,
    Color,
} from "cesium";

import { toCartographic, isBetween, onEscape, setCursor } from "./lib/utils";
import { Helper } from "./lib/helper";
import { Handler } from "./lib/handler";
import { TemporaryEntity } from "./lib/entity";
import { JulianDate } from "cesium";

// declare module "cesium" {
//     interface Viewer {
//         select: () => Promise<Entity[]>;
//     }
// }

class PickMultiple {
    viewer: Viewer
    ele: HTMLCanvasElement
    handler: Handler
    helper: Helper
    cleanup: () => void
    positions: number[]
    entity: TemporaryEntity
    callback: CallbackProperty
    resolver: (entities: Entity[]) => void
    moveHandler: (event: ScreenSpaceEventHandler.MotionEvent) => void
    firstClickHandler: (event: ScreenSpaceEventHandler.PositionedEvent) => void
    finalClickHandler: (event: ScreenSpaceEventHandler.PositionedEvent) => void

    constructor(viewer: Viewer) {
        this.viewer = viewer
        this.ele = viewer.canvas
        this.handler = new Handler(this.ele)
        this.helper = new Helper(viewer, {
            icon: "cursor-square",
            text: "Click to set the starting corner of the selection (Esc to cancel).",
        });
        this.cleanup = onEscape(() => this.reset());
        this.positions = []
        this.callback = new CallbackProperty(() => {
            try {
                // desstructure values from the positions array
                const [_west, _south, _east, _north] = this.positions;
                // set north to the max value because it should always be greater than the south value
                const north = Math.max(_north, _south);
                const south = Math.min(_north, _south);

                // initalize the values at min/max which works fine
                // unless you cross the idl
                let east = Math.max(_east, _west);
                let west = Math.min(_east, _west);

                // near idl
                // at the international date line, you need to flip
                // these values to prevent it from wrapping around the
                // back side of the globe
                if (east - west > 180) {
                    east = Math.min(_east, _west);
                    west = Math.max(_east, _west);
                }

                return Rectangle.fromDegrees(west, south, east, north);
            } catch {
                return Rectangle.fromDegrees(0, 0, 0, 0);
            }
        }, false);
        this.entity = new TemporaryEntity(
            {
                rectangle: {
                    coordinates: this.callback,
                    material: Color.CHARTREUSE.withAlpha(0.4),
                },
            },
            this.viewer
        );
        this.resolver = () => { }
        this.moveHandler = (event: ScreenSpaceEventHandler.MotionEvent) => this.onMove(event)
        this.firstClickHandler = (event: ScreenSpaceEventHandler.PositionedEvent) => this.onFirstClick(event)
        this.finalClickHandler = (event: ScreenSpaceEventHandler.PositionedEvent) => this.onFinalClick(event)
    }

    /**
       * Returns an array of all entities in all datasources within the current Cesium instance
       * @returns {Entity[]}
       */
    getAllEnities() {
        const entities: Entity[] = [...this.viewer.entities.values];

        try {
            const count = this.viewer.dataSources.length;
            let inc = 0;
            while (inc < count) {
                const source = this.viewer.dataSources.get(inc);
                entities.push(...source.entities.values);
                inc++;
            }
        } catch {
        } finally {
            return entities;
        }
    }

    /**
     * Filter function that returns boolean whether or not the provided entity is within
     * the currently selected rectangular coordinates
     * @param entity
     */
    inRect(entity: Entity) {
        const clock = this.viewer.clock;
        const currentTime = clock.currentTime;
        const position = entity.position?.getValue(currentTime);
        if (!position) return false;

        const [_west, _south, _east, _north] = this.positions;
        // set north to the max value because it should always be greater than the south value
        const north = Math.max(_north, _south);
        const south = Math.min(_north, _south);

        // initalize the values at min/max which works fine
        // unless you cross the idl
        let east = Math.max(_east, _west);
        let west = Math.min(_east, _west);

        // at the international date line, you need to flip
        // these values to prevent it from wrapping around the
        // back side of the globe
        const atIDL = east - west > 180;

        // near idl
        if (atIDL) {
            east = Math.min(_east, _west);
            west = Math.max(_east, _west);
        }

        // TODO: See if we actually need this part or can it be replaced with a call to
        // the current toCartographic function
        const carto = Cartographic.fromCartesian(position);
        const latitude = CMath.toDegrees(carto.latitude);
        const longitude = CMath.toDegrees(carto.longitude);


        if (
            !atIDL &&
            isBetween(latitude, south, north) &&
            isBetween(longitude, west, east)
        ) {
            return true;
        } else if (
            atIDL &&
            isBetween(latitude, south, north) &&
            (isBetween(longitude, west, 180) || isBetween(longitude, -180, east))
        ) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Resets the plugin by clearing the cached rectangle positions,
     * removing the recangle entity, resetting the cursor and destroying the
     * screen space event handler
     */
    reset() {
        try {
            this.handler.destroy();
            this.entity.remove();
            this.positions.length = 0;
            setCursor("default", this.viewer);
            this.helper.hide();
            this.cleanup();
        } catch { }
    }

    /**
     * Listens for a click to start/stop drawing the selection rectangle
     * @param event cesium positioned event
     */
    onFirstClick(event: ScreenSpaceEventHandler.PositionedEvent) {
        try {
            const cartographic = toCartographic(event.position, this.viewer);
            if (!cartographic) return;

            const { latitude, longitude } = cartographic;

            this.positions.push(longitude, latitude);
            this.handler.on("mouse_move", this.moveHandler);
            this.helper.update(
                `Now click again to set the position of opposite corner (Esc to cancel).`
            );
        } catch {
            this.resolver([]);
            this.reset();
        }
    }

    getRect() {
        const [_west, _south, _east, _north] = this.positions;
        // set north to the max value because it should always be greater than the south value
        const north = Math.max(_north, _south);
        const south = Math.min(_north, _south);

        // initalize the values at min/max which works fine
        // unless you cross the idl
        let east = Math.max(_east, _west);
        let west = Math.min(_east, _west);

        // at the international date line, you need to flip
        // these values to prevent it from wrapping around the
        // back side of the globe
        const atIDL = east - west > 180;

        // near idl
        if (atIDL) {
            east = Math.min(_east, _west);
            west = Math.max(_east, _west);
        }

        const rect = new Rectangle(west, south, east, north)
        return rect
    }

    /**
     * Listens for the final click to close off the selection and determine what entities are within
     * @param event cesium positioned event
     */
    onFinalClick(event: ScreenSpaceEventHandler.PositionedEvent) {
        try {
            const cartographic = toCartographic(event.position, this.viewer);
            if (!cartographic) return;

            const { latitude, longitude } = cartographic;
            this.positions.splice(2, 2, longitude, latitude);

            const entities = this.getAllEnities();
            const selected = entities
                .filter((entity) => entity.show) // filter out any entities that aren't visible
                .filter((entity) => this.inRect(entity)); // filter out anything not in the rectangle

            this.resolver(selected);
            this.reset();
        } catch {
            this.resolver([]);
            this.reset();
        }
    }

    /**
     * Listens for the mouse to move and will replace the last position with this new position
     * to make drawing the rectangle be interactive
     * @param event cesium mouse move event
     */
    onMove(event: ScreenSpaceEventHandler.MotionEvent) {
        try {
            const cartographic = toCartographic(event.endPosition, this.viewer);
            if (!cartographic) return;

            const { latitude, longitude } = cartographic;
            this.positions.splice(2, 2, longitude, latitude);

            this.entity.add();

            this.handler.on("left_click", this.finalClickHandler);
        } catch (err) {
            console.log(err);
            this.resolver([]);
            this.reset();
        }
    }

    pick() {
        return new Promise((resolve) => {
            try {
                this.resolver = resolve

                this.handler = new Handler(this.ele)
                this.handler.on("left_click", this.firstClickHandler);
                this.helper.show();
                setCursor('crosshair', this.viewer)
            } catch (err) {
                console.log(err)
            }
        })
    }
}

export default (viewer: Viewer) => {
    const item = new PickMultiple(viewer)
    return async () => await item.pick()
}
