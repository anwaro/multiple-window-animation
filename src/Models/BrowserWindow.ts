import {RgbColor} from '../Utils/Color';

export type BrowserWindowData = {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    color: RgbColor;
};

export class BrowserWindow {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    color: RgbColor;

    currentX: number;
    currentY: number;

    constructor(
        id: number,
        x: number,
        y: number,
        width: number,
        height: number,
        color: RgbColor,
    ) {
        this.id = id;
        this.x = x;
        this.currentX = x;
        this.y = y;
        this.currentY = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    static fromJson(data: BrowserWindowData) {
        return new BrowserWindow(
            data.id,
            data.x,
            data.y,
            data.width,
            data.height,
            data.color,
        );
    }

    updateFromJson(data: BrowserWindowData) {
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.width = data.width;
        this.height = data.height;
        this.color = data.color;
    }

    update() {
        const factor = 0.2;
        this.currentX += (this.x - this.currentX) * factor;
        this.currentY += (this.y - this.currentY) * factor;
    }

    toJson(): BrowserWindowData {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            color: this.color,
        };
    }

    center() {
        return {
            x: this.currentX + this.width / 2,
            y: this.currentY + this.height / 2,
        };
    }
}
