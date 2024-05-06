import {
    ScreenSpaceEventHandler,
    ScreenSpaceEventType
} from "cesium";
import type {
    EventType,
    EventHandlerCallback,
} from "../types";

export const EventTypeMap = new Map<EventType, ScreenSpaceEventType>([
    ["left_down", ScreenSpaceEventType.LEFT_DOWN],
    ["left_up", ScreenSpaceEventType.LEFT_UP],
    ["left_click", ScreenSpaceEventType.LEFT_CLICK],
    ["left_double_click", ScreenSpaceEventType.LEFT_DOUBLE_CLICK],
    ["right_down", ScreenSpaceEventType.RIGHT_DOWN],
    ["right_up", ScreenSpaceEventType.RIGHT_UP],
    ["right_click", ScreenSpaceEventType.RIGHT_CLICK],
    ["right_click", ScreenSpaceEventType.RIGHT_CLICK],
    ["middle_up", ScreenSpaceEventType.MIDDLE_UP],
    ["middle_click", ScreenSpaceEventType.MIDDLE_CLICK],
    ["middle_click", ScreenSpaceEventType.MIDDLE_CLICK],
    ["mouse_move", ScreenSpaceEventType.MOUSE_MOVE],
]);

export class Handler {
    handler: ScreenSpaceEventHandler | undefined;

    // init and create a new screenspace event handler
    constructor(ele: HTMLCanvasElement) {
        this.handler = new ScreenSpaceEventHandler(ele);
    }

    /**
     * Create an event listener for the provided event.
     * @param {EventType} type type of event
     * @param action 
     */
    on(
        type: EventType,
        action: EventHandlerCallback
    ) {
        const mapped = EventTypeMap.get(type);
        if (!mapped) return;
        this.handler?.setInputAction(action, mapped);
    }

    /**
     * Remove the event listener for the provided type
     * @param {EventType} type type of event
     */
    off(type: EventType) {
        const mapped = EventTypeMap.get(type);
        if (!mapped) return;
        this.handler?.removeInputAction(mapped);
    }

    /**
     * Destroy the screen space event handler
     */
    destroy() {
        this.handler?.destroy();
    }
}