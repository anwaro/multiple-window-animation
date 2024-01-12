import {BrowserWindow} from './BrowserWindow';
import {Color, RgbColor} from '../Utils/Color';

export class Particle {
    windowId: number;
    r: number;
    x: number;
    y: number;
    absoluteX: number;
    absoluteY: number;
    angle: number = 0;
    angleFactor: number = 0;
    color: RgbColor;
    currentColor: RgbColor;

    constructor(
        windowId: number,
        x: number,
        y: number,
        r: number,
        angleFactor: number,
        color: RgbColor,
    ) {
        this.windowId = windowId;
        this.r = r;
        this.x = x;
        this.absoluteX = x;
        this.y = y;
        this.absoluteY = y;
        this.angleFactor = angleFactor;
        this.color = color;
        this.currentColor = color;
    }

    static create(id: number, color: RgbColor, i: number) {
        function random(i: number) {
            const x = Math.sin(i) * 100;
            return x - Math.floor(x);
        }

        return new Particle(
            id,
            0,
            0,
            20 + random(i) * 500,
            1 + random(i * i) * 2,
            color,
        );
    }

    update(
        currentWindow: BrowserWindow,
        particleWindow: BrowserWindow,
        time: number,
        factor: number = 0.03,
    ) {
        this.angle = time * this.angleFactor;
        const center = particleWindow.center();
        this.absoluteX = this.r * Math.cos(this.angle) + center.x;
        this.absoluteY = this.r * Math.sin(this.angle) + center.y;
        this.x += (this.absoluteX - currentWindow.currentX - this.x) * factor;
        this.y += (this.absoluteY - currentWindow.currentY - this.y) * factor;
        this.currentColor = this.currentColor.map(
            (p, i) => p + (this.color[i] - p) * factor,
        ) as RgbColor;
    }

    getColor() {
        return Color.rgba(...this.currentColor);
    }
}
