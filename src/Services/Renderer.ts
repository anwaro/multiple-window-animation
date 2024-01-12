import {Particle} from '../Models/Particle';
import {Color} from '../Utils/Color';

export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor() {
        this.canvas = document.querySelector('canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
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
        this.ctx.fillStyle = Color.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderParticle(particle: Particle) {
        this.ctx.beginPath();
        this.ctx.fillStyle = particle.getColor();
        this.ctx.arc(particle.x, particle.y, 1, 0, 2 * Math.PI);
        this.ctx.fill();
    }
}
