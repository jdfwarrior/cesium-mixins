import type {
    UiConfig,
    UiIcon,
    UiPosition,
} from "../types";
import { icons } from "./icons";

function getUiLayout(position: string) {
    if (position === "topleft") {
        return { top: "10px", left: "8px" };
    } else if (position === "top") {
        return { top: "10px", left: "50%", transform: "translateX(-50%)" };
    } else if (position === "topright") {
        return { top: "45px", right: "8px" };
    } else if (position === "bottomleft") {
        return { bottom: "120px", left: "8px" };
    } else if (position === "bottom") {
        return { bottom: "36px", left: "50%", transform: "translateX(-50%)" };
    } else if (position === "bottomright") {
        return { bottom: "36px", right: "8px" };
    }
}

export class Helper {
    ele: HTMLDivElement | undefined;
    text: string = "";
    icon: string = "";
    position: UiPosition = "top";
    styles: Record<string, string> = {};
    buttons: { id: string; text: string; action: () => void }[] = [];
    visible: boolean = false;

    constructor(config?: UiConfig) {
        this.ele = document.createElement("div");

        if (config) {
            this.icon = config.icon ? icons.get(config.icon)! : "";
            this.text = config.text ?? "";
            this.position = config.position ?? "top";
            const positioning = getUiLayout(this.position);
            Object.assign(this.ele.style, positioning);
        } else {
            this.text = "Waiting..";
            this.position = "top";
            this.styles = {};
        }

        // allow passing in custom styling for the element
        if (config?.styles) Object.assign(this.ele.style, config.styles);

        this.ele.style.position = "absolute";
        this.ele.style.backgroundColor = "rgba(49 51 54 / 80%)";
        this.ele.style.border = "1px solid #444444";
        this.ele.style.borderRadius = "15px";
        this.ele.style.color = "#edffff";
        this.ele.style.padding = "2px 8px";
        this.ele.style.display = "flex";
        this.ele.style.alignItems = "center";
        this.ele.style.columnGap = "8px";
        this.ele.style.fontVariantNumeric = "tabular-nums";
        this.ele.style.fontSize = "13px";
        this.ele.style.zIndex = "1000";

        this.update(this.text);
    }

    update(text: string) {
        try {
            this.text = text;
            if (!this.ele) return;
            this.ele.innerHTML = `${this.icon}${this.icon ? " " : ""}${this.text}`;
        } catch { }
    }

    setStyles(styles: Record<string, string>) {
        if (!this.ele) return;
        Object.assign(this.ele?.style, styles);
    }

    isVisible() {
        return this.visible;
    }

    show() {
        try {
            if (!this.ele) return;
            document.body.appendChild(this.ele);
            this.visible = true;
        } catch { }
    }

    hide() {
        try {
            if (!this.ele) return;
            document.body.removeChild(this.ele);
            this.visible = false;
        } catch { }
    }
}