import {Storage} from '../Utils/Storage';
import {BrowserWindow, BrowserWindowData} from '../Models/BrowserWindow';
import {Color} from '../Utils/Color';

export class WindowManager {
    private store: Storage<BrowserWindowData[]>;
    private windows: BrowserWindow[];
    private window: BrowserWindow;

    constructor() {
        this.store = new Storage('windows');
        this.windows = this.getWindows();
        this.window = this.getWindow();
        this.windows.push(this.window);
        this.commit();
        this.initEvents();
    }

    private initEvents() {
        this.store.event(() => {
            this.windows = this.getWindows();
        });

        window.addEventListener('beforeunload', () => {
            this.removeWindow(this.window.id);
        });
    }

    private nextId() {
        return Math.max(...this.windows.map((w) => w.id), 0) + 1;
    }

    private getWindows() {
        return (this.store.get() || []).map((data) => BrowserWindow.fromJson(data));
    }

    private getWindow() {
        const shape = this.getWinShape();
        return new BrowserWindow(
            this.nextId(),
            shape.x,
            shape.y,
            shape.width,
            shape.height,
            Color.windowColor(),
        );
    }

    private didWindowUpdate() {
        const shape = this.getWinShape();

        return (
            shape.x != this.window.x ||
            shape.y != this.window.y ||
            shape.width != this.window.width ||
            shape.height != this.window.height
        );
    }

    private updateWindow() {
        this.window.updateFromJson({
            id: this.window.id,
            color: this.window.color,
            ...this.getWinShape(),
        });
        this.windows = this.windows.map((w) => {
            if (w.id === this.window.id) {
                return this.window;
            }
            return w;
        });
        this.commit();
    }

    private getWinShape() {
        return {
            x: window.screenLeft,
            y: window.screenTop,
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }

    private removeWindow(id: number) {
        this.windows = this.windows.filter((w) => w.id !== id);
        this.commit();
    }

    private commit() {
        this.store.save(this.windows.map((w) => w.toJson()));
    }

    update() {
        if (this.didWindowUpdate()) {
            this.updateWindow();
        }
        for (const window of this.windows) {
            window.update();
        }
    }

    getWindowById(id: number) {
        return this.windows.find((f) => f.id === id);
    }

    getCurrentWindow() {
        return this.window;
    }

    getCurrentWindows() {
        return this.windows;
    }

    onChange(callback: (value: BrowserWindowData[] | undefined) => void) {
        this.store.event(callback);
    }

    onClose(callback: (value: BrowserWindow[]) => void) {
        window.addEventListener('beforeunload', () => {
            callback(this.windows.filter((w) => w.id !== this.window.id));
        });
    }
}
