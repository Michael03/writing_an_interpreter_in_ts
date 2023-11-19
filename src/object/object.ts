import { Environment } from "../evaluator/environment";
import { BlockStatement, Identifier } from "../parser/ast";

export type MObject = MInteger | MBoolean | MNull | MReturn | MFunction | MError | MString | MBuiltin;

export const ObjectTypes = {
    M_INTEGER: "number",
    M_STRING: "string",
    M_BOOLEAN: "boolean",
    M_NULL: "null",
    M_RETURN: "return",
    M_FUNCTION: "function",
    M_ERROR: "error",
    M_BUILTIN: "builtin"
} as const;

export type OBJECT_TYPES = (typeof ObjectTypes)[keyof typeof ObjectTypes];

export class MInteger {
    readonly type = ObjectTypes.M_INTEGER;
    constructor(public value: number) { }
    inspect(): string {
        return this.value.toString();
    }
}
export class MString {
    readonly type = ObjectTypes.M_STRING;
    constructor(public value: string) { }
    inspect(): string {
        return this.value;
    }
}

export class MBoolean {
    readonly type = ObjectTypes.M_BOOLEAN;
    constructor(public value: boolean) { }
    inspect(): string {
        return this.value ? "true" : "false";
    }
}

export class MNull {
    readonly type = ObjectTypes.M_NULL;
    constructor() { }
    inspect(): string {
        return "null";
    }
}

export class MReturn {
    readonly type = ObjectTypes.M_RETURN;

    constructor(public value: MObject) { }
    inspect(): string {
        return this.value.inspect();
    }
}

export class MFunction {
    readonly type = ObjectTypes.M_FUNCTION;
    public parameters: Identifier[] = [];
    public body: BlockStatement | undefined;
    public env: Environment | undefined;
    constructor() { }
    inspect(): string {
        return `fn(${this.parameters.join(",")})\n{\n${this.body?.asString()}\n}`
    }
}

export class MBuiltin {
    readonly type = ObjectTypes.M_BUILTIN;
    constructor(public fn: Function) {}
    inspect(): string {
        return `builtin function`
    }
}

export class MError {
    readonly type = ObjectTypes.M_ERROR;
    constructor(public value: string) { }
    inspect(): string {
        return this.value;
    }
}