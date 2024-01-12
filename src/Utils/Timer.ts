export class Timer {
    private start: number;

    constructor() {
        const today = new Date();
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
