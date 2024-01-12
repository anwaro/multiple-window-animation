import {Particle} from '../Models/Particle';
import {BrowserWindow} from '../Models/BrowserWindow';
import {Storage} from '../Utils/Storage';

export type ParticlesData = Record<number, number[]>;

export class ParticleManager {
    private count = 600;
    private store: Storage<ParticlesData>;
    private particlesGroups: ParticlesData;
    private particles: Particle[];

    constructor(
        windows: BrowserWindow[],
        currentWindow: BrowserWindow,
        time: number,
    ) {
        this.store = new Storage('particles');
        this.particles = this.createParticles(windows, currentWindow, time);
        this.particlesGroups = this.store.get() || {};
        this.updateGroups(windows);
        this.store.event((val) => {
            this.particlesGroups = val || {};
        });
    }

    private createParticles(
        windows: BrowserWindow[],
        currentWindow: BrowserWindow,
        time: number,
    ) {
        const array = Array(this.count).fill(1);
        if (windows.length === 1) {
            return array.map((_, i) =>
                Particle.create(windows[0].id, windows[0].color, i),
            );
        }

        return array.map((_, i) => {
            const window = this.getWindow(windows, i);
            const particle = Particle.create(window.id, window.color, i);
            particle.update(currentWindow, window, time, 1);
            return particle;
        });
    }

    private getWindow(windows: BrowserWindow[], i: number) {
        if (!this.particlesGroups) {
            return windows[0];
        }
        const val = this.entities().find(([, indexes]) => indexes.includes(i));

        if (!val) {
            return windows[0];
        }

        return windows.find((w) => w.id == val[0]) || windows[0];
    }

    private commit() {
        this.store.save(this.particlesGroups);
    }

    private entities(): [number, number[]][] {
        return Object.entries(this.particlesGroups).map(([key, value]) => [
            Number(key),
            value,
        ]);
    }

    updateGroups(windows: BrowserWindow[]) {
        if (windows.length === 1) {
            this.particlesGroups = {
                [windows[0].id]: this.particles.map((_, i) => i),
            };
            return this.commit();
        }

        const groups = this.entities();

        const targetCount = Math.floor(this.count / windows.length);
        const ids = this.diff(
            groups.map((g) => g[0]),
            windows.map((w) => w.id),
        );
        if (ids.length === 0) {
            return;
        }

        const id = ids[0];

        if (groups.length < windows.length) {
            // new window
            const particlesForNewGroup: number[] = [];
            for (const i in groups) {
                const particles = groups[i][1];
                if (particles.length > targetCount) {
                    groups[i][1] = particles.slice(0, targetCount);
                    particlesForNewGroup.push(
                        ...particles.slice(targetCount, particles.length),
                    );
                }
            }
            groups.push([id, particlesForNewGroup]);
            this.particlesGroups = Object.fromEntries(groups);
        } else {
            // closed window
            const removedGroup = groups.find(([_id]) => _id === id);
            const newGroups = groups.filter(([_id]) => _id !== id);

            if (removedGroup) {
                let particles = removedGroup[1];
                const perGroup = Math.ceil(particles.length / windows.length);

                for (const i in newGroups) {
                    const count = Math.min(particles.length, perGroup);

                    newGroups[i][1] = [
                        ...newGroups[i][1],
                        ...particles.slice(0, count),
                    ];
                    particles = particles.slice(count, particles.length);
                }
                newGroups[0][1].push(...particles);
                this.particlesGroups = Object.fromEntries(newGroups);
            }
        }

        this.commit();
    }

    private diff(a: number[], b: number[]) {
        return a
            .filter((x) => !b.includes(x))
            .concat(b.filter((x) => !a.includes(x)));
    }

    update(windows: BrowserWindow[], currentWindow: BrowserWindow) {
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

    onChange(callback: (value: ParticlesData | undefined) => void) {
        this.store.event(callback);
    }
}
