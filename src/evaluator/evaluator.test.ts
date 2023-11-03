import { test, expect } from "@jest/globals";
import { Lexer } from "../lexer";
import { Parser } from "../parser/parser";
import { MObject, ObjectTypes } from "../object/object";
import { mEval } from "./evaluator";
test("Evan Integer Expression", () => {
    const tests = [
        { input: "5", expected: 5 }
    ];
    for (const test of tests) {
        const evaluated = testEval(test.input);
        testIntegerObject(evaluated, test.expected);
    }
})


// Helpers
const testEval = (input: string) => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    return mEval(program);
}

const testIntegerObject = (object: MObject, expected: number): void => {
    expect(object.type).toBe(ObjectTypes.M_INTEGER);
    if (object.type === ObjectTypes.M_INTEGER) {
        expect(object.value).toBe(expected);
    } else {
        throw new Error(`Not INteger ${object}`);
    }
}