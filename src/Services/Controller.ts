import {WindowManager} from '../Managers/WindowManager';
import {Renderer} from './Renderer';
import {Timer} from '../Utils/Timer';
import {ParticleManager} from '../Managers/ParticleManager';

export class Controller {
    private windowManager: WindowManager;
    private particleManager: ParticleManager;
    private renderer: Renderer;
    private timer: Timer;

    constructor() {
        this.timer = new Timer();
        this.renderer = new Renderer();
        this.windowManager = new WindowManager();

        this.particleManager = new ParticleManager(
            this.windowManager.getCurrentWindows(),
            this.windowManager.getCurrentWindow(),
            this.timer.getTime(),
        );

        this.particleManager.update(
            this.windowManager.getCurrentWindows(),
            this.windowManager.getCurrentWindow(),
        );

        this.windowManager.onChange(() => {
            this.particleManager.update(
                this.windowManager.getCurrentWindows(),
                this.windowManager.getCurrentWindow(),
            );
        });

        this.particleManager.onChange(() => {
            this.particleManager.update(
                this.windowManager.getCurrentWindows(),
                this.windowManager.getCurrentWindow(),
            );
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
