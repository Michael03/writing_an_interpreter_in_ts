import { MObject } from "../object/object";

export class Environment {
    private store: Map<string, MObject> = new Map();

    constructor(private env: Environment | undefined = undefined) { }
    set(name: string, value: MObject): void {
        this.store.set(name, value)
    }

    get(name: string): MObject | undefined {

        if (this.store.has(name)) {
            return this.store.get(name);
        }
        if (this.env !== undefined) {
            return this.env.get(name);
        }
        return undefined;
    }
}