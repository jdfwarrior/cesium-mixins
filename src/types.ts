import { ScreenSpaceEventHandler, ScreenSpaceEventType } from "cesium";

export interface CartographicDegrees {
  latitude: number;
  longitude: number;
  altitude: number;
}

// TODO: Need to create a type to restrict the values passed here
export type Cursor =
  | "default"
  | "crosshair"
  | "pointer"
  | "not-allowed"
  | "grab"
  | "grabbing"
  | "cell"
  | "move";

export type UiPosition =
  | "topleft"
  | "top"
  | "topright"
  | "bottomleft"
  | "bottom"
  | "bottomright";

export type UiIcon = "cursor" | "cursor-click" | "cursor-square" | "play" | "pause" | "clock" | "speed" | "";

export interface UiConfig {
  position?: UiPosition;
  icon?: UiIcon;
  text?: string;
  styles?: Record<string, string>;
}

export type EventType =
  | "left_down"
  | "left_up"
  | "left_click"
  | "left_double_click"
  | "right_down"
  | "right_up"
  | "right_click"
  | "middle_down"
  | "middle_up"
  | "middle_click"
  | "mouse_move";

export interface MeasureConfig {
  unit: "km" | "m" | "mi"
}

export type EventHandlerCallback = ScreenSpaceEventHandler.MotionEventCallback | ScreenSpaceEventHandler.PositionedEventCallback