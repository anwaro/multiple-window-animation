export type RgbColor = [number, number, number];

export class Color {
    static background = Color.rgba(0, 0, 0, 0.05);

    static rgba(r: number, g: number, b: number, a: number = 1) {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    static hsla(h: number, s: number, l: number, a: number = 1) {
        return `hsla(${h}, ${s}%, ${l}%, ${a})`;
    }

    static windowColor(): RgbColor {
        return Color.hslToRgb(Math.random() * 360, 100, 50);
    }

    static hslToRgb(h: number, s: number, l: number): RgbColor {
        s /= 100;
        l /= 100;
        const k = (n: number) => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = (n: number) =>
            l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [255 * f(0), 255 * f(8), 255 * f(4)];
    }
}
