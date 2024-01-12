export class Storage<T> {
    #key: string;

    constructor(key: string) {
        this.#key = key;
    }

    save(data: T) {
        try {
            localStorage.setItem(this.#key, JSON.stringify(data));
        } catch (e) {
            // pass
        }
    }

    get(): T | undefined {
        try {
            const data = localStorage.getItem(this.#key);
            if (data) {
                return JSON.parse(data) as T;
            }
        } catch (e) {
            // pass
        }
        return undefined;
    }

    event(callback: (value: T | undefined) => void) {
        addEventListener('storage', (event) => {
            if (event.key == this.#key) {
                callback(this.get());
            }
        });
    }
}
