/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/Managers/ParticleManager.ts":
/*!*****************************************!*\
  !*** ./src/Managers/ParticleManager.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ParticleManager = void 0;
const Particle_1 = __webpack_require__(/*! ../Models/Particle */ "./src/Models/Particle.ts");
const Storage_1 = __webpack_require__(/*! ../Utils/Storage */ "./src/Utils/Storage.ts");
class ParticleManager {
    constructor(windows, currentWindow, time) {
        this.count = 600;
        this.store = new Storage_1.Storage('particles');
        this.particles = this.createParticles(windows, currentWindow, time);
        this.particlesGroups = this.store.get() || {};
        this.updateGroups(windows);
        this.store.event((val) => {
            this.particlesGroups = val || {};
        });
    }
    createParticles(windows, currentWindow, time) {
        let array = Array(this.count).fill(1);
        if (windows.length === 1) {
            return array.map((_, i) => Particle_1.Particle.create(windows[0].id, windows[0].color, i));
        }
        return array.map((_, i) => {
            const window = this.getWindow(windows, i);
            const particle = Particle_1.Particle.create(window.id, window.color, i);
            particle.update(currentWindow, window, time, 1);
            return particle;
        });
    }
    getWindow(windows, i) {
        if (!this.particlesGroups) {
            return windows[0];
        }
        const val = this.entities()
            .find(([, indexes]) => indexes.includes(i));
        if (!val) {
            return windows[0];
        }
        return windows.find(w => w.id == val[0]) || windows[0];
    }
    commit() {
        this.store.save(this.particlesGroups);
    }
    entities() {
        return Object
            .entries(this.particlesGroups)
            .map(([key, value]) => [Number(key), value]);
    }
    updateGroups(windows) {
        if (windows.length === 1) {
            this.particlesGroups = { [windows[0].id]: this.particles.map((_, i) => i) };
            return this.commit();
        }
        let groups = this.entities();
        const targetCount = Math.floor(this.count / windows.length);
        const ids = this.diff(groups.map(g => g[0]), windows.map(w => w.id));
        if (ids.length === 0) {
            return;
        }
        const id = ids[0];
        console.log(groups);
        if (groups.length < windows.length) {
            const particlesForNewGroup = [];
            for (const i in groups) {
                const particles = groups[i][1];
                if (particles.length > targetCount) {
                    groups[i][1] = particles.slice(0, targetCount);
                    particlesForNewGroup.push(...particles.slice(targetCount, particles.length));
                }
            }
            groups.push([id, particlesForNewGroup]);
            this.particlesGroups = Object.fromEntries(groups);
            console.log(groups);
        }
        else {
            const removedGroup = groups.find(([_id]) => _id === id);
            const newGroups = groups.filter(([_id]) => _id !== id);
            if (removedGroup) {
                let particles = removedGroup[1];
                let perGroup = Math.ceil(particles.length / windows.length);
                for (const i in newGroups) {
                    const count = Math.min(particles.length, perGroup);
                    newGroups[i][1] = [...newGroups[i][1], ...particles.slice(0, count)];
                    particles = particles.slice(count, particles.length);
                }
                newGroups[0][1].push(...particles);
                this.particlesGroups = Object.fromEntries(newGroups);
            }
        }
        this.commit();
    }
    diff(a, b) {
        return a.filter(x => !b.includes(x))
            .concat(b.filter(x => !a.includes(x)));
    }
    update(windows, currentWindow) {
        console.log(this.particlesGroups);
        this.particles = this.particles.map((particle, i) => {
            const newWindow = this.getWindow(windows, i);
            if (particle.windowId === newWindow.id) {
                return particle;
            }
            particle.windowId = newWindow.id;
            particle.color = newWindow.color;
            particle.x = particle.absoluteX - currentWindow.currentX;
            particle.y = particle.absoluteY - currentWindow.currentY;
            return particle;
        });
    }
    getParticles() {
        return this.particles;
    }
    onChange(callback) {
        this.store.event(callback);
    }
}
exports.ParticleManager = ParticleManager;


/***/ }),

/***/ "./src/Managers/WindowManager.ts":
/*!***************************************!*\
  !*** ./src/Managers/WindowManager.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WindowManager = void 0;
const Storage_1 = __webpack_require__(/*! ../Utils/Storage */ "./src/Utils/Storage.ts");
const BrowserWindow_1 = __webpack_require__(/*! ../Models/BrowserWindow */ "./src/Models/BrowserWindow.ts");
const Color_1 = __webpack_require__(/*! ../Utils/Color */ "./src/Utils/Color.ts");
class WindowManager {
    constructor() {
        this.store = new Storage_1.Storage('windows');
        this.windows = this.getWindows();
        this.window = this.getWindow();
        this.windows.push(this.window);
        this.commit();
        this.initEvents();
    }
    initEvents() {
        this.store.event(() => {
            this.windows = this.getWindows();
        });
        window.addEventListener('beforeunload', () => {
            this.removeWindow(this.window.id);
        });
    }
    nextId() {
        return Math.max(...this.windows.map((w) => w.id), 0) + 1;
    }
    getWindows() {
        return (this.store.get() || []).map((data) => BrowserWindow_1.BrowserWindow.fromJson(data));
    }
    getWindow() {
        const shape = this.getWinShape();
        return new BrowserWindow_1.BrowserWindow(this.nextId(), shape.x, shape.y, shape.width, shape.height, Color_1.Color.windowColor());
    }
    didWindowUpdate() {
        const shape = this.getWinShape();
        return (shape.x != this.window.x ||
            shape.y != this.window.y ||
            shape.width != this.window.width ||
            shape.height != this.window.height);
    }
    updateWindow() {
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
    getWinShape() {
        return {
            x: window.screenLeft,
            y: window.screenTop,
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }
    removeWindow(id) {
        this.windows = this.windows.filter((w) => w.id !== id);
        this.commit();
    }
    commit() {
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
    getWindowById(id) {
        return this.windows.find((f) => f.id === id);
    }
    getCurrentWindow() {
        return this.window;
    }
    getCurrentWindows() {
        return this.windows;
    }
    onChange(callback) {
        this.store.event(callback);
    }
    onClose(callback) {
        window.addEventListener('beforeunload', () => {
            callback(this.windows.filter(w => w.id !== this.window.id));
        });
    }
}
exports.WindowManager = WindowManager;


/***/ }),

/***/ "./src/Models/BrowserWindow.ts":
/*!*************************************!*\
  !*** ./src/Models/BrowserWindow.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BrowserWindow = void 0;
class BrowserWindow {
    constructor(id, x, y, width, height, color) {
        this.id = id;
        this.x = x;
        this.currentX = x;
        this.y = y;
        this.currentY = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }
    static fromJson(data) {
        return new BrowserWindow(data.id, data.x, data.y, data.width, data.height, data.color);
    }
    updateFromJson(data) {
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
    toJson() {
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
exports.BrowserWindow = BrowserWindow;


/***/ }),

/***/ "./src/Models/Particle.ts":
/*!********************************!*\
  !*** ./src/Models/Particle.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Particle = void 0;
const Color_1 = __webpack_require__(/*! ../Utils/Color */ "./src/Utils/Color.ts");
class Particle {
    constructor(windowId, x, y, r, angleFactor, color) {
        this.angle = 0;
        this.angleFactor = 0;
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
    static create(id, color, i) {
        function random(i) {
            const x = Math.sin(i) * 100;
            return x - Math.floor(x);
        }
        return new Particle(id, 0, 0, 20 + random(i) * 500, 1 + random(i * i) * 2, color);
    }
    update(currentWindow, particleWindow, time, factor = 0.03) {
        this.angle = time * this.angleFactor;
        const center = particleWindow.center();
        this.absoluteX = this.r * Math.cos(this.angle) + center.x;
        this.absoluteY = this.r * Math.sin(this.angle) + center.y;
        this.x += (this.absoluteX - currentWindow.currentX - this.x) * factor;
        this.y += (this.absoluteY - currentWindow.currentY - this.y) * factor;
        this.currentColor = this.currentColor.map((p, i) => p + (this.color[i] - p) * factor);
    }
    getColor() {
        return Color_1.Color.rgba(...this.currentColor);
    }
}
exports.Particle = Particle;


/***/ }),

/***/ "./src/Services/Controller.ts":
/*!************************************!*\
  !*** ./src/Services/Controller.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Controller = void 0;
const WindowManager_1 = __webpack_require__(/*! ../Managers/WindowManager */ "./src/Managers/WindowManager.ts");
const Renderer_1 = __webpack_require__(/*! ./Renderer */ "./src/Services/Renderer.ts");
const Timer_1 = __webpack_require__(/*! ../Utils/Timer */ "./src/Utils/Timer.ts");
const ParticleManager_1 = __webpack_require__(/*! ../Managers/ParticleManager */ "./src/Managers/ParticleManager.ts");
class Controller {
    constructor() {
        this.timer = new Timer_1.Timer();
        this.renderer = new Renderer_1.Renderer();
        this.windowManager = new WindowManager_1.WindowManager();
        this.particleManager = new ParticleManager_1.ParticleManager(this.windowManager.getCurrentWindows(), this.windowManager.getCurrentWindow(), this.timer.getTime());
        this.particleManager.update(this.windowManager.getCurrentWindows(), this.windowManager.getCurrentWindow());
        this.windowManager.onChange(() => {
            this.particleManager.update(this.windowManager.getCurrentWindows(), this.windowManager.getCurrentWindow());
        });
        this.particleManager.onChange(() => {
            this.particleManager.update(this.windowManager.getCurrentWindows(), this.windowManager.getCurrentWindow());
        });
        this.windowManager.onClose((windows) => {
            this.particleManager.updateGroups(windows);
        });
    }
    render() {
        window.requestAnimationFrame(this.render.bind(this));
        const time = this.timer.getTime();
        this.renderer.nextFrame();
        this.windowManager.update();
        this.particleManager.getParticles().forEach((particle) => {
            const window = this.windowManager.getWindowById(particle.windowId);
            if (window) {
                particle.update(this.windowManager.getCurrentWindow(), window, time);
                this.renderer.renderParticle(particle);
            }
        });
    }
}
exports.Controller = Controller;


/***/ }),

/***/ "./src/Services/Renderer.ts":
/*!**********************************!*\
  !*** ./src/Services/Renderer.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Renderer = void 0;
const Color_1 = __webpack_require__(/*! ../Utils/Color */ "./src/Utils/Color.ts");
class Renderer {
    constructor() {
        this.canvas = document.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.setSize();
        window.addEventListener('resize', this.setSize.bind(this));
        this.initBody();
    }
    setSize() {
        this.canvas.height = window.innerHeight;
        this.canvas.width = window.innerWidth;
    }
    initBody() {
        document.body.style.backgroundColor = 'black';
        document.body.style.overflow = 'hidden';
    }
    nextFrame() {
        this.ctx.fillStyle = Color_1.Color.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    renderParticle(particle) {
        this.ctx.beginPath();
        this.ctx.fillStyle = particle.getColor();
        this.ctx.arc(particle.x, particle.y, 1, 0, 2 * Math.PI);
        this.ctx.fill();
    }
}
exports.Renderer = Renderer;


/***/ }),

/***/ "./src/Utils/Color.ts":
/*!****************************!*\
  !*** ./src/Utils/Color.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Color = void 0;
class Color {
    static rgba(r, g, b, a = 1) {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    static hsla(h, s, l, a = 1) {
        return `hsla(${h}, ${s}%, ${l}%, ${a})`;
    }
    static windowColor() {
        return Color.hslToRgb(Math.random() * 360, 100, 50);
    }
    static hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        const k = (n) => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [255 * f(0), 255 * f(8), 255 * f(4)];
    }
    ;
}
exports.Color = Color;
Color.background = Color.rgba(0, 0, 0, 0.05);


/***/ }),

/***/ "./src/Utils/Storage.ts":
/*!******************************!*\
  !*** ./src/Utils/Storage.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports) {


var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Storage_key;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Storage = void 0;
class Storage {
    constructor(key) {
        _Storage_key.set(this, void 0);
        __classPrivateFieldSet(this, _Storage_key, key, "f");
    }
    save(data) {
        try {
            localStorage.setItem(__classPrivateFieldGet(this, _Storage_key, "f"), JSON.stringify(data));
        }
        catch (e) {
        }
    }
    get() {
        try {
            const data = localStorage.getItem(__classPrivateFieldGet(this, _Storage_key, "f"));
            if (data) {
                return JSON.parse(data);
            }
        }
        catch (e) {
        }
        return undefined;
    }
    event(callback) {
        addEventListener('storage', (event) => {
            if (event.key == __classPrivateFieldGet(this, _Storage_key, "f")) {
                callback(this.get());
            }
        });
    }
}
exports.Storage = Storage;
_Storage_key = new WeakMap();


/***/ }),

/***/ "./src/Utils/Timer.ts":
/*!****************************!*\
  !*** ./src/Utils/Timer.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Timer = void 0;
class Timer {
    constructor() {
        let today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        this.start = today.getTime();
    }
    getTime() {
        return (new Date().getTime() - this.start) / 1000.0;
    }
}
exports.Timer = Timer;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const Controller_1 = __webpack_require__(/*! ./Services/Controller */ "./src/Services/Controller.ts");
const controller = new Controller_1.Controller();
controller.render();

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELHVCQUF1QjtBQUN2QixtQkFBbUIsbUJBQU8sQ0FBQyxvREFBb0I7QUFDL0Msa0JBQWtCLG1CQUFPLENBQUMsZ0RBQWtCO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1Qjs7Ozs7Ozs7Ozs7QUNuSFY7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0QscUJBQXFCO0FBQ3JCLGtCQUFrQixtQkFBTyxDQUFDLGdEQUFrQjtBQUM1Qyx3QkFBd0IsbUJBQU8sQ0FBQyw4REFBeUI7QUFDekQsZ0JBQWdCLG1CQUFPLENBQUMsNENBQWdCO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EscUJBQXFCOzs7Ozs7Ozs7OztBQy9GUjtBQUNiLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjs7Ozs7Ozs7Ozs7QUMvQ1I7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0QsZ0JBQWdCO0FBQ2hCLGdCQUFnQixtQkFBTyxDQUFDLDRDQUFnQjtBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjs7Ozs7Ozs7Ozs7QUN0Q0g7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsa0JBQWtCO0FBQ2xCLHdCQUF3QixtQkFBTyxDQUFDLGtFQUEyQjtBQUMzRCxtQkFBbUIsbUJBQU8sQ0FBQyw4Q0FBWTtBQUN2QyxnQkFBZ0IsbUJBQU8sQ0FBQyw0Q0FBZ0I7QUFDeEMsMEJBQTBCLG1CQUFPLENBQUMsc0VBQTZCO0FBQy9EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxrQkFBa0I7Ozs7Ozs7Ozs7O0FDdENMO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELGdCQUFnQjtBQUNoQixnQkFBZ0IsbUJBQU8sQ0FBQyw0Q0FBZ0I7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCOzs7Ozs7Ozs7OztBQy9CSDtBQUNiLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxhQUFhO0FBQ2I7QUFDQTtBQUNBLHVCQUF1QixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO0FBQzNDO0FBQ0E7QUFDQSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRTtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiOzs7Ozs7Ozs7OztBQ3hCYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxlQUFlO0FBQ2Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGVBQWU7QUFDZjs7Ozs7Ozs7Ozs7QUMvQ2E7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0QsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTs7Ozs7OztVQ2hCYjtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7Ozs7Ozs7O0FDdEJhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELHFCQUFxQixtQkFBTyxDQUFDLDJEQUF1QjtBQUNwRDtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbXVsdGlwbGUtd2luZG93cy8uL3NyYy9NYW5hZ2Vycy9QYXJ0aWNsZU1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vbXVsdGlwbGUtd2luZG93cy8uL3NyYy9NYW5hZ2Vycy9XaW5kb3dNYW5hZ2VyLnRzIiwid2VicGFjazovL211bHRpcGxlLXdpbmRvd3MvLi9zcmMvTW9kZWxzL0Jyb3dzZXJXaW5kb3cudHMiLCJ3ZWJwYWNrOi8vbXVsdGlwbGUtd2luZG93cy8uL3NyYy9Nb2RlbHMvUGFydGljbGUudHMiLCJ3ZWJwYWNrOi8vbXVsdGlwbGUtd2luZG93cy8uL3NyYy9TZXJ2aWNlcy9Db250cm9sbGVyLnRzIiwid2VicGFjazovL211bHRpcGxlLXdpbmRvd3MvLi9zcmMvU2VydmljZXMvUmVuZGVyZXIudHMiLCJ3ZWJwYWNrOi8vbXVsdGlwbGUtd2luZG93cy8uL3NyYy9VdGlscy9Db2xvci50cyIsIndlYnBhY2s6Ly9tdWx0aXBsZS13aW5kb3dzLy4vc3JjL1V0aWxzL1N0b3JhZ2UudHMiLCJ3ZWJwYWNrOi8vbXVsdGlwbGUtd2luZG93cy8uL3NyYy9VdGlscy9UaW1lci50cyIsIndlYnBhY2s6Ly9tdWx0aXBsZS13aW5kb3dzL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL211bHRpcGxlLXdpbmRvd3MvLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBhcnRpY2xlTWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IFBhcnRpY2xlXzEgPSByZXF1aXJlKFwiLi4vTW9kZWxzL1BhcnRpY2xlXCIpO1xuY29uc3QgU3RvcmFnZV8xID0gcmVxdWlyZShcIi4uL1V0aWxzL1N0b3JhZ2VcIik7XG5jbGFzcyBQYXJ0aWNsZU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKHdpbmRvd3MsIGN1cnJlbnRXaW5kb3csIHRpbWUpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDYwMDtcbiAgICAgICAgdGhpcy5zdG9yZSA9IG5ldyBTdG9yYWdlXzEuU3RvcmFnZSgncGFydGljbGVzJyk7XG4gICAgICAgIHRoaXMucGFydGljbGVzID0gdGhpcy5jcmVhdGVQYXJ0aWNsZXMod2luZG93cywgY3VycmVudFdpbmRvdywgdGltZSk7XG4gICAgICAgIHRoaXMucGFydGljbGVzR3JvdXBzID0gdGhpcy5zdG9yZS5nZXQoKSB8fCB7fTtcbiAgICAgICAgdGhpcy51cGRhdGVHcm91cHMod2luZG93cyk7XG4gICAgICAgIHRoaXMuc3RvcmUuZXZlbnQoKHZhbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wYXJ0aWNsZXNHcm91cHMgPSB2YWwgfHwge307XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjcmVhdGVQYXJ0aWNsZXMod2luZG93cywgY3VycmVudFdpbmRvdywgdGltZSkge1xuICAgICAgICBsZXQgYXJyYXkgPSBBcnJheSh0aGlzLmNvdW50KS5maWxsKDEpO1xuICAgICAgICBpZiAod2luZG93cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiBhcnJheS5tYXAoKF8sIGkpID0+IFBhcnRpY2xlXzEuUGFydGljbGUuY3JlYXRlKHdpbmRvd3NbMF0uaWQsIHdpbmRvd3NbMF0uY29sb3IsIGkpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXJyYXkubWFwKChfLCBpKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLmdldFdpbmRvdyh3aW5kb3dzLCBpKTtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRpY2xlID0gUGFydGljbGVfMS5QYXJ0aWNsZS5jcmVhdGUod2luZG93LmlkLCB3aW5kb3cuY29sb3IsIGkpO1xuICAgICAgICAgICAgcGFydGljbGUudXBkYXRlKGN1cnJlbnRXaW5kb3csIHdpbmRvdywgdGltZSwgMSk7XG4gICAgICAgICAgICByZXR1cm4gcGFydGljbGU7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRXaW5kb3cod2luZG93cywgaSkge1xuICAgICAgICBpZiAoIXRoaXMucGFydGljbGVzR3JvdXBzKSB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93c1swXTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWwgPSB0aGlzLmVudGl0aWVzKClcbiAgICAgICAgICAgIC5maW5kKChbLCBpbmRleGVzXSkgPT4gaW5kZXhlcy5pbmNsdWRlcyhpKSk7XG4gICAgICAgIGlmICghdmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93c1swXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd2luZG93cy5maW5kKHcgPT4gdy5pZCA9PSB2YWxbMF0pIHx8IHdpbmRvd3NbMF07XG4gICAgfVxuICAgIGNvbW1pdCgpIHtcbiAgICAgICAgdGhpcy5zdG9yZS5zYXZlKHRoaXMucGFydGljbGVzR3JvdXBzKTtcbiAgICB9XG4gICAgZW50aXRpZXMoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3RcbiAgICAgICAgICAgIC5lbnRyaWVzKHRoaXMucGFydGljbGVzR3JvdXBzKVxuICAgICAgICAgICAgLm1hcCgoW2tleSwgdmFsdWVdKSA9PiBbTnVtYmVyKGtleSksIHZhbHVlXSk7XG4gICAgfVxuICAgIHVwZGF0ZUdyb3Vwcyh3aW5kb3dzKSB7XG4gICAgICAgIGlmICh3aW5kb3dzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdGhpcy5wYXJ0aWNsZXNHcm91cHMgPSB7IFt3aW5kb3dzWzBdLmlkXTogdGhpcy5wYXJ0aWNsZXMubWFwKChfLCBpKSA9PiBpKSB9O1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29tbWl0KCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGdyb3VwcyA9IHRoaXMuZW50aXRpZXMoKTtcbiAgICAgICAgY29uc3QgdGFyZ2V0Q291bnQgPSBNYXRoLmZsb29yKHRoaXMuY291bnQgLyB3aW5kb3dzLmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IGlkcyA9IHRoaXMuZGlmZihncm91cHMubWFwKGcgPT4gZ1swXSksIHdpbmRvd3MubWFwKHcgPT4gdy5pZCkpO1xuICAgICAgICBpZiAoaWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlkID0gaWRzWzBdO1xuICAgICAgICBjb25zb2xlLmxvZyhncm91cHMpO1xuICAgICAgICBpZiAoZ3JvdXBzLmxlbmd0aCA8IHdpbmRvd3MubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBwYXJ0aWNsZXNGb3JOZXdHcm91cCA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBpIGluIGdyb3Vwcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnRpY2xlcyA9IGdyb3Vwc1tpXVsxXTtcbiAgICAgICAgICAgICAgICBpZiAocGFydGljbGVzLmxlbmd0aCA+IHRhcmdldENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGdyb3Vwc1tpXVsxXSA9IHBhcnRpY2xlcy5zbGljZSgwLCB0YXJnZXRDb3VudCk7XG4gICAgICAgICAgICAgICAgICAgIHBhcnRpY2xlc0Zvck5ld0dyb3VwLnB1c2goLi4ucGFydGljbGVzLnNsaWNlKHRhcmdldENvdW50LCBwYXJ0aWNsZXMubGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ3JvdXBzLnB1c2goW2lkLCBwYXJ0aWNsZXNGb3JOZXdHcm91cF0pO1xuICAgICAgICAgICAgdGhpcy5wYXJ0aWNsZXNHcm91cHMgPSBPYmplY3QuZnJvbUVudHJpZXMoZ3JvdXBzKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGdyb3Vwcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCByZW1vdmVkR3JvdXAgPSBncm91cHMuZmluZCgoW19pZF0pID0+IF9pZCA9PT0gaWQpO1xuICAgICAgICAgICAgY29uc3QgbmV3R3JvdXBzID0gZ3JvdXBzLmZpbHRlcigoW19pZF0pID0+IF9pZCAhPT0gaWQpO1xuICAgICAgICAgICAgaWYgKHJlbW92ZWRHcm91cCkge1xuICAgICAgICAgICAgICAgIGxldCBwYXJ0aWNsZXMgPSByZW1vdmVkR3JvdXBbMV07XG4gICAgICAgICAgICAgICAgbGV0IHBlckdyb3VwID0gTWF0aC5jZWlsKHBhcnRpY2xlcy5sZW5ndGggLyB3aW5kb3dzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBpIGluIG5ld0dyb3Vwcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IE1hdGgubWluKHBhcnRpY2xlcy5sZW5ndGgsIHBlckdyb3VwKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3R3JvdXBzW2ldWzFdID0gWy4uLm5ld0dyb3Vwc1tpXVsxXSwgLi4ucGFydGljbGVzLnNsaWNlKDAsIGNvdW50KV07XG4gICAgICAgICAgICAgICAgICAgIHBhcnRpY2xlcyA9IHBhcnRpY2xlcy5zbGljZShjb3VudCwgcGFydGljbGVzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5ld0dyb3Vwc1swXVsxXS5wdXNoKC4uLnBhcnRpY2xlcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJ0aWNsZXNHcm91cHMgPSBPYmplY3QuZnJvbUVudHJpZXMobmV3R3JvdXBzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbW1pdCgpO1xuICAgIH1cbiAgICBkaWZmKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEuZmlsdGVyKHggPT4gIWIuaW5jbHVkZXMoeCkpXG4gICAgICAgICAgICAuY29uY2F0KGIuZmlsdGVyKHggPT4gIWEuaW5jbHVkZXMoeCkpKTtcbiAgICB9XG4gICAgdXBkYXRlKHdpbmRvd3MsIGN1cnJlbnRXaW5kb3cpIHtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5wYXJ0aWNsZXNHcm91cHMpO1xuICAgICAgICB0aGlzLnBhcnRpY2xlcyA9IHRoaXMucGFydGljbGVzLm1hcCgocGFydGljbGUsIGkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1dpbmRvdyA9IHRoaXMuZ2V0V2luZG93KHdpbmRvd3MsIGkpO1xuICAgICAgICAgICAgaWYgKHBhcnRpY2xlLndpbmRvd0lkID09PSBuZXdXaW5kb3cuaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFydGljbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXJ0aWNsZS53aW5kb3dJZCA9IG5ld1dpbmRvdy5pZDtcbiAgICAgICAgICAgIHBhcnRpY2xlLmNvbG9yID0gbmV3V2luZG93LmNvbG9yO1xuICAgICAgICAgICAgcGFydGljbGUueCA9IHBhcnRpY2xlLmFic29sdXRlWCAtIGN1cnJlbnRXaW5kb3cuY3VycmVudFg7XG4gICAgICAgICAgICBwYXJ0aWNsZS55ID0gcGFydGljbGUuYWJzb2x1dGVZIC0gY3VycmVudFdpbmRvdy5jdXJyZW50WTtcbiAgICAgICAgICAgIHJldHVybiBwYXJ0aWNsZTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldFBhcnRpY2xlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFydGljbGVzO1xuICAgIH1cbiAgICBvbkNoYW5nZShjYWxsYmFjaykge1xuICAgICAgICB0aGlzLnN0b3JlLmV2ZW50KGNhbGxiYWNrKTtcbiAgICB9XG59XG5leHBvcnRzLlBhcnRpY2xlTWFuYWdlciA9IFBhcnRpY2xlTWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5XaW5kb3dNYW5hZ2VyID0gdm9pZCAwO1xuY29uc3QgU3RvcmFnZV8xID0gcmVxdWlyZShcIi4uL1V0aWxzL1N0b3JhZ2VcIik7XG5jb25zdCBCcm93c2VyV2luZG93XzEgPSByZXF1aXJlKFwiLi4vTW9kZWxzL0Jyb3dzZXJXaW5kb3dcIik7XG5jb25zdCBDb2xvcl8xID0gcmVxdWlyZShcIi4uL1V0aWxzL0NvbG9yXCIpO1xuY2xhc3MgV2luZG93TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuc3RvcmUgPSBuZXcgU3RvcmFnZV8xLlN0b3JhZ2UoJ3dpbmRvd3MnKTtcbiAgICAgICAgdGhpcy53aW5kb3dzID0gdGhpcy5nZXRXaW5kb3dzKCk7XG4gICAgICAgIHRoaXMud2luZG93ID0gdGhpcy5nZXRXaW5kb3coKTtcbiAgICAgICAgdGhpcy53aW5kb3dzLnB1c2godGhpcy53aW5kb3cpO1xuICAgICAgICB0aGlzLmNvbW1pdCgpO1xuICAgICAgICB0aGlzLmluaXRFdmVudHMoKTtcbiAgICB9XG4gICAgaW5pdEV2ZW50cygpIHtcbiAgICAgICAgdGhpcy5zdG9yZS5ldmVudCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLndpbmRvd3MgPSB0aGlzLmdldFdpbmRvd3MoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdiZWZvcmV1bmxvYWQnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZVdpbmRvdyh0aGlzLndpbmRvdy5pZCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBuZXh0SWQoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLm1heCguLi50aGlzLndpbmRvd3MubWFwKCh3KSA9PiB3LmlkKSwgMCkgKyAxO1xuICAgIH1cbiAgICBnZXRXaW5kb3dzKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuc3RvcmUuZ2V0KCkgfHwgW10pLm1hcCgoZGF0YSkgPT4gQnJvd3NlcldpbmRvd18xLkJyb3dzZXJXaW5kb3cuZnJvbUpzb24oZGF0YSkpO1xuICAgIH1cbiAgICBnZXRXaW5kb3coKSB7XG4gICAgICAgIGNvbnN0IHNoYXBlID0gdGhpcy5nZXRXaW5TaGFwZSgpO1xuICAgICAgICByZXR1cm4gbmV3IEJyb3dzZXJXaW5kb3dfMS5Ccm93c2VyV2luZG93KHRoaXMubmV4dElkKCksIHNoYXBlLngsIHNoYXBlLnksIHNoYXBlLndpZHRoLCBzaGFwZS5oZWlnaHQsIENvbG9yXzEuQ29sb3Iud2luZG93Q29sb3IoKSk7XG4gICAgfVxuICAgIGRpZFdpbmRvd1VwZGF0ZSgpIHtcbiAgICAgICAgY29uc3Qgc2hhcGUgPSB0aGlzLmdldFdpblNoYXBlKCk7XG4gICAgICAgIHJldHVybiAoc2hhcGUueCAhPSB0aGlzLndpbmRvdy54IHx8XG4gICAgICAgICAgICBzaGFwZS55ICE9IHRoaXMud2luZG93LnkgfHxcbiAgICAgICAgICAgIHNoYXBlLndpZHRoICE9IHRoaXMud2luZG93LndpZHRoIHx8XG4gICAgICAgICAgICBzaGFwZS5oZWlnaHQgIT0gdGhpcy53aW5kb3cuaGVpZ2h0KTtcbiAgICB9XG4gICAgdXBkYXRlV2luZG93KCkge1xuICAgICAgICB0aGlzLndpbmRvdy51cGRhdGVGcm9tSnNvbih7XG4gICAgICAgICAgICBpZDogdGhpcy53aW5kb3cuaWQsXG4gICAgICAgICAgICBjb2xvcjogdGhpcy53aW5kb3cuY29sb3IsXG4gICAgICAgICAgICAuLi50aGlzLmdldFdpblNoYXBlKCksXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLndpbmRvd3MgPSB0aGlzLndpbmRvd3MubWFwKCh3KSA9PiB7XG4gICAgICAgICAgICBpZiAody5pZCA9PT0gdGhpcy53aW5kb3cuaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53aW5kb3c7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdztcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY29tbWl0KCk7XG4gICAgfVxuICAgIGdldFdpblNoYXBlKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogd2luZG93LnNjcmVlbkxlZnQsXG4gICAgICAgICAgICB5OiB3aW5kb3cuc2NyZWVuVG9wLFxuICAgICAgICAgICAgd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHJlbW92ZVdpbmRvdyhpZCkge1xuICAgICAgICB0aGlzLndpbmRvd3MgPSB0aGlzLndpbmRvd3MuZmlsdGVyKCh3KSA9PiB3LmlkICE9PSBpZCk7XG4gICAgICAgIHRoaXMuY29tbWl0KCk7XG4gICAgfVxuICAgIGNvbW1pdCgpIHtcbiAgICAgICAgdGhpcy5zdG9yZS5zYXZlKHRoaXMud2luZG93cy5tYXAoKHcpID0+IHcudG9Kc29uKCkpKTtcbiAgICB9XG4gICAgdXBkYXRlKCkge1xuICAgICAgICBpZiAodGhpcy5kaWRXaW5kb3dVcGRhdGUoKSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVXaW5kb3coKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IHdpbmRvdyBvZiB0aGlzLndpbmRvd3MpIHtcbiAgICAgICAgICAgIHdpbmRvdy51cGRhdGUoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRXaW5kb3dCeUlkKGlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLndpbmRvd3MuZmluZCgoZikgPT4gZi5pZCA9PT0gaWQpO1xuICAgIH1cbiAgICBnZXRDdXJyZW50V2luZG93KCkge1xuICAgICAgICByZXR1cm4gdGhpcy53aW5kb3c7XG4gICAgfVxuICAgIGdldEN1cnJlbnRXaW5kb3dzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy53aW5kb3dzO1xuICAgIH1cbiAgICBvbkNoYW5nZShjYWxsYmFjaykge1xuICAgICAgICB0aGlzLnN0b3JlLmV2ZW50KGNhbGxiYWNrKTtcbiAgICB9XG4gICAgb25DbG9zZShjYWxsYmFjaykge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgKCkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy53aW5kb3dzLmZpbHRlcih3ID0+IHcuaWQgIT09IHRoaXMud2luZG93LmlkKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuV2luZG93TWFuYWdlciA9IFdpbmRvd01hbmFnZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQnJvd3NlcldpbmRvdyA9IHZvaWQgMDtcbmNsYXNzIEJyb3dzZXJXaW5kb3cge1xuICAgIGNvbnN0cnVjdG9yKGlkLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBjb2xvcikge1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMuY3VycmVudFggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLmN1cnJlbnRZID0geTtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuICAgIH1cbiAgICBzdGF0aWMgZnJvbUpzb24oZGF0YSkge1xuICAgICAgICByZXR1cm4gbmV3IEJyb3dzZXJXaW5kb3coZGF0YS5pZCwgZGF0YS54LCBkYXRhLnksIGRhdGEud2lkdGgsIGRhdGEuaGVpZ2h0LCBkYXRhLmNvbG9yKTtcbiAgICB9XG4gICAgdXBkYXRlRnJvbUpzb24oZGF0YSkge1xuICAgICAgICB0aGlzLmlkID0gZGF0YS5pZDtcbiAgICAgICAgdGhpcy54ID0gZGF0YS54O1xuICAgICAgICB0aGlzLnkgPSBkYXRhLnk7XG4gICAgICAgIHRoaXMud2lkdGggPSBkYXRhLndpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGRhdGEuaGVpZ2h0O1xuICAgICAgICB0aGlzLmNvbG9yID0gZGF0YS5jb2xvcjtcbiAgICB9XG4gICAgdXBkYXRlKCkge1xuICAgICAgICBjb25zdCBmYWN0b3IgPSAwLjI7XG4gICAgICAgIHRoaXMuY3VycmVudFggKz0gKHRoaXMueCAtIHRoaXMuY3VycmVudFgpICogZmFjdG9yO1xuICAgICAgICB0aGlzLmN1cnJlbnRZICs9ICh0aGlzLnkgLSB0aGlzLmN1cnJlbnRZKSAqIGZhY3RvcjtcbiAgICB9XG4gICAgdG9Kc29uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICAgICAgICB4OiB0aGlzLngsXG4gICAgICAgICAgICB5OiB0aGlzLnksXG4gICAgICAgICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcixcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY2VudGVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogdGhpcy5jdXJyZW50WCArIHRoaXMud2lkdGggLyAyLFxuICAgICAgICAgICAgeTogdGhpcy5jdXJyZW50WSArIHRoaXMuaGVpZ2h0IC8gMixcbiAgICAgICAgfTtcbiAgICB9XG59XG5leHBvcnRzLkJyb3dzZXJXaW5kb3cgPSBCcm93c2VyV2luZG93O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBhcnRpY2xlID0gdm9pZCAwO1xuY29uc3QgQ29sb3JfMSA9IHJlcXVpcmUoXCIuLi9VdGlscy9Db2xvclwiKTtcbmNsYXNzIFBhcnRpY2xlIHtcbiAgICBjb25zdHJ1Y3Rvcih3aW5kb3dJZCwgeCwgeSwgciwgYW5nbGVGYWN0b3IsIGNvbG9yKSB7XG4gICAgICAgIHRoaXMuYW5nbGUgPSAwO1xuICAgICAgICB0aGlzLmFuZ2xlRmFjdG9yID0gMDtcbiAgICAgICAgdGhpcy53aW5kb3dJZCA9IHdpbmRvd0lkO1xuICAgICAgICB0aGlzLnIgPSByO1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLmFic29sdXRlWCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMuYWJzb2x1dGVZID0geTtcbiAgICAgICAgdGhpcy5hbmdsZUZhY3RvciA9IGFuZ2xlRmFjdG9yO1xuICAgICAgICB0aGlzLmNvbG9yID0gY29sb3I7XG4gICAgICAgIHRoaXMuY3VycmVudENvbG9yID0gY29sb3I7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGUoaWQsIGNvbG9yLCBpKSB7XG4gICAgICAgIGZ1bmN0aW9uIHJhbmRvbShpKSB7XG4gICAgICAgICAgICBjb25zdCB4ID0gTWF0aC5zaW4oaSkgKiAxMDA7XG4gICAgICAgICAgICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBQYXJ0aWNsZShpZCwgMCwgMCwgMjAgKyByYW5kb20oaSkgKiA1MDAsIDEgKyByYW5kb20oaSAqIGkpICogMiwgY29sb3IpO1xuICAgIH1cbiAgICB1cGRhdGUoY3VycmVudFdpbmRvdywgcGFydGljbGVXaW5kb3csIHRpbWUsIGZhY3RvciA9IDAuMDMpIHtcbiAgICAgICAgdGhpcy5hbmdsZSA9IHRpbWUgKiB0aGlzLmFuZ2xlRmFjdG9yO1xuICAgICAgICBjb25zdCBjZW50ZXIgPSBwYXJ0aWNsZVdpbmRvdy5jZW50ZXIoKTtcbiAgICAgICAgdGhpcy5hYnNvbHV0ZVggPSB0aGlzLnIgKiBNYXRoLmNvcyh0aGlzLmFuZ2xlKSArIGNlbnRlci54O1xuICAgICAgICB0aGlzLmFic29sdXRlWSA9IHRoaXMuciAqIE1hdGguc2luKHRoaXMuYW5nbGUpICsgY2VudGVyLnk7XG4gICAgICAgIHRoaXMueCArPSAodGhpcy5hYnNvbHV0ZVggLSBjdXJyZW50V2luZG93LmN1cnJlbnRYIC0gdGhpcy54KSAqIGZhY3RvcjtcbiAgICAgICAgdGhpcy55ICs9ICh0aGlzLmFic29sdXRlWSAtIGN1cnJlbnRXaW5kb3cuY3VycmVudFkgLSB0aGlzLnkpICogZmFjdG9yO1xuICAgICAgICB0aGlzLmN1cnJlbnRDb2xvciA9IHRoaXMuY3VycmVudENvbG9yLm1hcCgocCwgaSkgPT4gcCArICh0aGlzLmNvbG9yW2ldIC0gcCkgKiBmYWN0b3IpO1xuICAgIH1cbiAgICBnZXRDb2xvcigpIHtcbiAgICAgICAgcmV0dXJuIENvbG9yXzEuQ29sb3IucmdiYSguLi50aGlzLmN1cnJlbnRDb2xvcik7XG4gICAgfVxufVxuZXhwb3J0cy5QYXJ0aWNsZSA9IFBhcnRpY2xlO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkNvbnRyb2xsZXIgPSB2b2lkIDA7XG5jb25zdCBXaW5kb3dNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vTWFuYWdlcnMvV2luZG93TWFuYWdlclwiKTtcbmNvbnN0IFJlbmRlcmVyXzEgPSByZXF1aXJlKFwiLi9SZW5kZXJlclwiKTtcbmNvbnN0IFRpbWVyXzEgPSByZXF1aXJlKFwiLi4vVXRpbHMvVGltZXJcIik7XG5jb25zdCBQYXJ0aWNsZU1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi9NYW5hZ2Vycy9QYXJ0aWNsZU1hbmFnZXJcIik7XG5jbGFzcyBDb250cm9sbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy50aW1lciA9IG5ldyBUaW1lcl8xLlRpbWVyKCk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIgPSBuZXcgUmVuZGVyZXJfMS5SZW5kZXJlcigpO1xuICAgICAgICB0aGlzLndpbmRvd01hbmFnZXIgPSBuZXcgV2luZG93TWFuYWdlcl8xLldpbmRvd01hbmFnZXIoKTtcbiAgICAgICAgdGhpcy5wYXJ0aWNsZU1hbmFnZXIgPSBuZXcgUGFydGljbGVNYW5hZ2VyXzEuUGFydGljbGVNYW5hZ2VyKHRoaXMud2luZG93TWFuYWdlci5nZXRDdXJyZW50V2luZG93cygpLCB0aGlzLndpbmRvd01hbmFnZXIuZ2V0Q3VycmVudFdpbmRvdygpLCB0aGlzLnRpbWVyLmdldFRpbWUoKSk7XG4gICAgICAgIHRoaXMucGFydGljbGVNYW5hZ2VyLnVwZGF0ZSh0aGlzLndpbmRvd01hbmFnZXIuZ2V0Q3VycmVudFdpbmRvd3MoKSwgdGhpcy53aW5kb3dNYW5hZ2VyLmdldEN1cnJlbnRXaW5kb3coKSk7XG4gICAgICAgIHRoaXMud2luZG93TWFuYWdlci5vbkNoYW5nZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBhcnRpY2xlTWFuYWdlci51cGRhdGUodGhpcy53aW5kb3dNYW5hZ2VyLmdldEN1cnJlbnRXaW5kb3dzKCksIHRoaXMud2luZG93TWFuYWdlci5nZXRDdXJyZW50V2luZG93KCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5wYXJ0aWNsZU1hbmFnZXIub25DaGFuZ2UoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wYXJ0aWNsZU1hbmFnZXIudXBkYXRlKHRoaXMud2luZG93TWFuYWdlci5nZXRDdXJyZW50V2luZG93cygpLCB0aGlzLndpbmRvd01hbmFnZXIuZ2V0Q3VycmVudFdpbmRvdygpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMud2luZG93TWFuYWdlci5vbkNsb3NlKCh3aW5kb3dzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBhcnRpY2xlTWFuYWdlci51cGRhdGVHcm91cHMod2luZG93cyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5yZW5kZXIuYmluZCh0aGlzKSk7XG4gICAgICAgIGNvbnN0IHRpbWUgPSB0aGlzLnRpbWVyLmdldFRpbWUoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5uZXh0RnJhbWUoKTtcbiAgICAgICAgdGhpcy53aW5kb3dNYW5hZ2VyLnVwZGF0ZSgpO1xuICAgICAgICB0aGlzLnBhcnRpY2xlTWFuYWdlci5nZXRQYXJ0aWNsZXMoKS5mb3JFYWNoKChwYXJ0aWNsZSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy53aW5kb3dNYW5hZ2VyLmdldFdpbmRvd0J5SWQocGFydGljbGUud2luZG93SWQpO1xuICAgICAgICAgICAgaWYgKHdpbmRvdykge1xuICAgICAgICAgICAgICAgIHBhcnRpY2xlLnVwZGF0ZSh0aGlzLndpbmRvd01hbmFnZXIuZ2V0Q3VycmVudFdpbmRvdygpLCB3aW5kb3csIHRpbWUpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIucmVuZGVyUGFydGljbGUocGFydGljbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkNvbnRyb2xsZXIgPSBDb250cm9sbGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlJlbmRlcmVyID0gdm9pZCAwO1xuY29uc3QgQ29sb3JfMSA9IHJlcXVpcmUoXCIuLi9VdGlscy9Db2xvclwiKTtcbmNsYXNzIFJlbmRlcmVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0aGlzLnNldFNpemUoKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuc2V0U2l6ZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5pbml0Qm9keSgpO1xuICAgIH1cbiAgICBzZXRTaXplKCkge1xuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgfVxuICAgIGluaXRCb2R5KCkge1xuICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdibGFjayc7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICB9XG4gICAgbmV4dEZyYW1lKCkge1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBDb2xvcl8xLkNvbG9yLmJhY2tncm91bmQ7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgICByZW5kZXJQYXJ0aWNsZShwYXJ0aWNsZSkge1xuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gcGFydGljbGUuZ2V0Q29sb3IoKTtcbiAgICAgICAgdGhpcy5jdHguYXJjKHBhcnRpY2xlLngsIHBhcnRpY2xlLnksIDEsIDAsIDIgKiBNYXRoLlBJKTtcbiAgICAgICAgdGhpcy5jdHguZmlsbCgpO1xuICAgIH1cbn1cbmV4cG9ydHMuUmVuZGVyZXIgPSBSZW5kZXJlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Db2xvciA9IHZvaWQgMDtcbmNsYXNzIENvbG9yIHtcbiAgICBzdGF0aWMgcmdiYShyLCBnLCBiLCBhID0gMSkge1xuICAgICAgICByZXR1cm4gYHJnYmEoJHtyfSwgJHtnfSwgJHtifSwgJHthfSlgO1xuICAgIH1cbiAgICBzdGF0aWMgaHNsYShoLCBzLCBsLCBhID0gMSkge1xuICAgICAgICByZXR1cm4gYGhzbGEoJHtofSwgJHtzfSUsICR7bH0lLCAke2F9KWA7XG4gICAgfVxuICAgIHN0YXRpYyB3aW5kb3dDb2xvcigpIHtcbiAgICAgICAgcmV0dXJuIENvbG9yLmhzbFRvUmdiKE1hdGgucmFuZG9tKCkgKiAzNjAsIDEwMCwgNTApO1xuICAgIH1cbiAgICBzdGF0aWMgaHNsVG9SZ2IoaCwgcywgbCkge1xuICAgICAgICBzIC89IDEwMDtcbiAgICAgICAgbCAvPSAxMDA7XG4gICAgICAgIGNvbnN0IGsgPSAobikgPT4gKG4gKyBoIC8gMzApICUgMTI7XG4gICAgICAgIGNvbnN0IGEgPSBzICogTWF0aC5taW4obCwgMSAtIGwpO1xuICAgICAgICBjb25zdCBmID0gKG4pID0+IGwgLSBhICogTWF0aC5tYXgoLTEsIE1hdGgubWluKGsobikgLSAzLCBNYXRoLm1pbig5IC0gayhuKSwgMSkpKTtcbiAgICAgICAgcmV0dXJuIFsyNTUgKiBmKDApLCAyNTUgKiBmKDgpLCAyNTUgKiBmKDQpXTtcbiAgICB9XG4gICAgO1xufVxuZXhwb3J0cy5Db2xvciA9IENvbG9yO1xuQ29sb3IuYmFja2dyb3VuZCA9IENvbG9yLnJnYmEoMCwgMCwgMCwgMC4wNSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2NsYXNzUHJpdmF0ZUZpZWxkU2V0ID0gKHRoaXMgJiYgdGhpcy5fX2NsYXNzUHJpdmF0ZUZpZWxkU2V0KSB8fCBmdW5jdGlvbiAocmVjZWl2ZXIsIHN0YXRlLCB2YWx1ZSwga2luZCwgZikge1xuICAgIGlmIChraW5kID09PSBcIm1cIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgbWV0aG9kIGlzIG5vdCB3cml0YWJsZVwiKTtcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBzZXR0ZXJcIik7XG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3Qgd3JpdGUgcHJpdmF0ZSBtZW1iZXIgdG8gYW4gb2JqZWN0IHdob3NlIGNsYXNzIGRpZCBub3QgZGVjbGFyZSBpdFwiKTtcbiAgICByZXR1cm4gKGtpbmQgPT09IFwiYVwiID8gZi5jYWxsKHJlY2VpdmVyLCB2YWx1ZSkgOiBmID8gZi52YWx1ZSA9IHZhbHVlIDogc3RhdGUuc2V0KHJlY2VpdmVyLCB2YWx1ZSkpLCB2YWx1ZTtcbn07XG52YXIgX19jbGFzc1ByaXZhdGVGaWVsZEdldCA9ICh0aGlzICYmIHRoaXMuX19jbGFzc1ByaXZhdGVGaWVsZEdldCkgfHwgZnVuY3Rpb24gKHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xuICAgIGlmIChraW5kID09PSBcImFcIiAmJiAhZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgYWNjZXNzb3Igd2FzIGRlZmluZWQgd2l0aG91dCBhIGdldHRlclwiKTtcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCByZWFkIHByaXZhdGUgbWVtYmVyIGZyb20gYW4gb2JqZWN0IHdob3NlIGNsYXNzIGRpZCBub3QgZGVjbGFyZSBpdFwiKTtcbiAgICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xufTtcbnZhciBfU3RvcmFnZV9rZXk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlN0b3JhZ2UgPSB2b2lkIDA7XG5jbGFzcyBTdG9yYWdlIHtcbiAgICBjb25zdHJ1Y3RvcihrZXkpIHtcbiAgICAgICAgX1N0b3JhZ2Vfa2V5LnNldCh0aGlzLCB2b2lkIDApO1xuICAgICAgICBfX2NsYXNzUHJpdmF0ZUZpZWxkU2V0KHRoaXMsIF9TdG9yYWdlX2tleSwga2V5LCBcImZcIik7XG4gICAgfVxuICAgIHNhdmUoZGF0YSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oX19jbGFzc1ByaXZhdGVGaWVsZEdldCh0aGlzLCBfU3RvcmFnZV9rZXksIFwiZlwiKSwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0KCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKF9fY2xhc3NQcml2YXRlRmllbGRHZXQodGhpcywgX1N0b3JhZ2Vfa2V5LCBcImZcIikpO1xuICAgICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGV2ZW50KGNhbGxiYWNrKSB7XG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXIoJ3N0b3JhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5rZXkgPT0gX19jbGFzc1ByaXZhdGVGaWVsZEdldCh0aGlzLCBfU3RvcmFnZV9rZXksIFwiZlwiKSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMuZ2V0KCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlN0b3JhZ2UgPSBTdG9yYWdlO1xuX1N0b3JhZ2Vfa2V5ID0gbmV3IFdlYWtNYXAoKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5UaW1lciA9IHZvaWQgMDtcbmNsYXNzIFRpbWVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgbGV0IHRvZGF5ID0gbmV3IERhdGUoKTtcbiAgICAgICAgdG9kYXkuc2V0SG91cnMoMCk7XG4gICAgICAgIHRvZGF5LnNldE1pbnV0ZXMoMCk7XG4gICAgICAgIHRvZGF5LnNldFNlY29uZHMoMCk7XG4gICAgICAgIHRvZGF5LnNldE1pbGxpc2Vjb25kcygwKTtcbiAgICAgICAgdGhpcy5zdGFydCA9IHRvZGF5LmdldFRpbWUoKTtcbiAgICB9XG4gICAgZ2V0VGltZSgpIHtcbiAgICAgICAgcmV0dXJuIChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHRoaXMuc3RhcnQpIC8gMTAwMC4wO1xuICAgIH1cbn1cbmV4cG9ydHMuVGltZXIgPSBUaW1lcjtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IENvbnRyb2xsZXJfMSA9IHJlcXVpcmUoXCIuL1NlcnZpY2VzL0NvbnRyb2xsZXJcIik7XG5jb25zdCBjb250cm9sbGVyID0gbmV3IENvbnRyb2xsZXJfMS5Db250cm9sbGVyKCk7XG5jb250cm9sbGVyLnJlbmRlcigpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9