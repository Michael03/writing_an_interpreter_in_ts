export type MObject = MInteger | MBoolean | MNull;

export const ObjectTypes = {
    M_INTEGER: "number",
    M_BOOLEAN: "boolean",
    M_NULL: "null",
} as const;

export type OBJECT_TYPES = (typeof ObjectTypes)[keyof typeof ObjectTypes];

export class MInteger {
    readonly type = ObjectTypes.M_INTEGER;
    constructor(public value: number) { }
    inspect() {
        return this.value.toString();
    }
}

export class MBoolean {
    readonly type = ObjectTypes.M_BOOLEAN;
    constructor(public value: boolean) { }
    inspect() {
        return this.value ? "true" : "false";
    }
}

export class MNull {
    readonly type = ObjectTypes.M_NULL;
    constructor() { }
    inspect() {
        return null;
    }
}