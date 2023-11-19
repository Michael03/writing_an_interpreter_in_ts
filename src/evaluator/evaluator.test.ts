import { test, expect } from "@jest/globals";
import { Lexer } from "../lexer";
import { Parser } from "../parser/parser";
import { MError, MFunction, MObject, ObjectTypes } from "../object/object";
import { NULL, mEval } from "./evaluator";
import { Environment } from "./environment";

test("Eval integer expression", () => {
    const tests = [
        { input: "5", expected: 5 },
        { input: "10", expected: 10 }
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        testIntegerObject(evaluated, test.expected);
    }
});

test("Eval string concatenation expression", () => {
    const input = '"Hello" + " " + "World!"';
    const evaluated = testEval(input);
    expect(evaluated.type).toBe(ObjectTypes.M_STRING);
    if (evaluated.type === ObjectTypes.M_STRING) {
        expect(evaluated.value).toBe("Hello World!");
    } else {
        throw new Error(`Not M_STRING ${evaluated}`);
    }
});

test("Eval boolean expression", () => {
    const tests = [
        { input: "true;", expected: true },
        { input: "false;", expected: false },
        { input: "true == true;", expected: true },
        { input: "false == false;", expected: true },
        { input: "true != false;", expected: true },
        { input: "true != true;", expected: false },
        { input: "(1 < 2) == true;", expected: true },
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        testBooleanObject(evaluated, test.expected);
    }
});

test("Eval bang operator", () => {
    const tests = [
        { input: "!true;", expected: false },
        { input: "!false;", expected: true },
        { input: "!5;", expected: false },
        { input: "!!true;", expected: true },
        { input: "!!false;", expected: false },
        { input: "!!5;", expected: true },
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        testBooleanObject(evaluated, test.expected);
    }
});

test("Eval minus operator", () => {
    const tests = [
        { input: "-5;", expected: -5 },
        { input: "-10;", expected: -10 }
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        testIntegerObject(evaluated, test.expected);
    }
});

test("Eval integer infix expression", () => {
    const tests = [
        { input: "5 + 5 + 5 - 10", expected: 5 },
        { input: "5 * 5 + 5", expected: 30 },
        { input: "5 + 5 * 5", expected: 30 },
        { input: "(5 + 5) * 5", expected: 50 },
        { input: "10 / 2", expected: 5 },
        { input: "10 - 2", expected: 8 },
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        testIntegerObject(evaluated, test.expected);
    }
});

test("Eval boolean infix expression", () => {
    const tests = [
        { input: "1 < 2", expected: true },
        { input: "1 > 2", expected: false },
        { input: "1 < 1", expected: false },
        { input: "1 > 1", expected: false },
        { input: "1 == 1", expected: true },
        { input: "1 == 2", expected: false },
        { input: "1 != 2", expected: true },
        { input: "1 == 2", expected: false },
        { input: "1 != 1", expected: false },
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        testBooleanObject(evaluated, test.expected);
    }
});

test("Eval if else expression", () => {
    const tests = [
        { input: "if(true) { 10 }", expected: 10 },
        { input: "if(false) { 10 }", expected: null },
        { input: "if(1) { 10 }", expected: 10 },
        { input: "if(1 < 2) { 10 }", expected: 10 },
        { input: "if(false) { 10 } else {20}", expected: 20 },
        { input: "if(true) {10} else {20}", expected: 10 },
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        if (test.expected === null) {
            testNullObject(evaluated)
        } else {
            testIntegerObject(evaluated, test.expected);
        }
    }
});

test("Evan return expression", () => {
    const tests = [
        { input: "return 10", expected: 10 },
        { input: "return 2", expected: 2 },
        { input: "return 5; 1", expected: 5 },
        {
            input: `
            if( 10 > 1) {
                if( 10 > 1) {
                    return 10;
                }
                return 1;
            }
        `, expected: 10
        },
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        testIntegerObject(evaluated, test.expected);
    }
});

test("Eval error handling", () => {
    const tests = [
        { input: "5 + true;", expected: "type mismatch: number + boolean" },
        { input: "5 + true; 5;", expected: "type mismatch: number + boolean" },
        { input: "-true", expected: "unknown operator: -boolean" },
        { input: "true + false", expected: "unknown operator: boolean + boolean" },
        { input: "5; true + false; 5", expected: "unknown operator: boolean + boolean" },
        { input: "foobar;", expected: "identifier not found: foobar" },
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        testErrorObject(evaluated, test.expected);
    }
});

test("Eval let statement", () => {
    const tests = [
        { input: "let a = 5; a;", expected: 5 },
        { input: "let a = 5 * 5; a;", expected: 25 },
        { input: "let a = 5; let b = a; b;", expected: 5 },
        { input: "let a = 5; let b = a; let c = a + b + 5; c", expected: 15 },
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        testIntegerObject(evaluated, test.expected);
    }
});

test("Eval function object", () => {
    const tests = [
        { input: "fn(x) {x + 2;};", expected: 5 },
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        expect(evaluated.constructor.name).toBe(MFunction.name);
        if (evaluated.type == ObjectTypes.M_FUNCTION) {
            expect(evaluated.parameters.length).toEqual(1);
            expect(evaluated.parameters[0].asString()).toEqual('x');
            expect(evaluated.body?.asString()).toEqual('(x + 2)');
        } else {
            throw new Error(`type ${evaluated.type} is not ${ObjectTypes.M_FUNCTION}`);
        }
    }
});

test("Eval function call", () => {
    const tests = [
        { input: "let identity = fn(x) { x; }; identity(5);", expected: 5 },
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        testIntegerObject(evaluated, test.expected);
    }
});

test.only("Eval builtin call", () => {
    const tests = [
        { input: 'len("")', expected: 0 },
        { input: 'len("four")', expected: 5 },
        // { input: 'len(4)', expected: "argument to `len` not supported, got MINTEGER" },
        // { input: 'len("one", "two")', expected: "wrong number of arguments. got=2, want=1" },
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        console.log(evaluated);
        switch (typeof test.expected) {
            case "number":
                testIntegerObject(evaluated, test.expected);
                break;
            case "string":
                expect(evaluated.type).toBe(ObjectTypes.M_ERROR);
                expect((evaluated as MError).value).toBe(test.expected);
                break;
        }
    }
});

// Helpers
const testEval = (input: string) => {
    const env = new Environment();
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    return mEval(program, env);
}

const testIntegerObject = (object: MObject, expected: number): void => {
    expect(object.type).toBe(ObjectTypes.M_INTEGER);
    if (object.type === ObjectTypes.M_INTEGER) {
        expect(object.value).toBe(expected);
    } else {
        throw new Error(`Not MInteger ${object}`);
    }
}

const testBooleanObject = (object: MObject, expected: boolean): void => {
    expect(object.type).toBe(ObjectTypes.M_BOOLEAN);
    if (object.type === ObjectTypes.M_BOOLEAN) {
        expect(object.value).toBe(expected);
    } else {
        throw new Error(`Not MBoolean ${object}`);
    }
}

const testNullObject = (object: MObject): void => {
    expect(object.type).toBe(ObjectTypes.M_NULL);
    if (object.type === ObjectTypes.M_NULL) {
        expect(object).toBe(NULL);
    } else {
        throw new Error(`Not NULL ${object}`);
    }
}

const testErrorObject = (object: MObject, expected: string): void => {
    expect(object.type).toBe(ObjectTypes.M_ERROR);
    if (object.type === ObjectTypes.M_ERROR) {
        expect(object.value).toBe(expected);
    } else {
        throw new Error(`Not MERROR type ${object}`);
    }
}


