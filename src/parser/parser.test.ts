import { test, expect, } from "@jest/globals";
import { Lexer, Tokens } from "../lexer";
import { Parser } from "./parser";
import {
    ExpressionStatement,
    Identifier,
    IntegerLiteral,
    LetStatement,
    Program,
    ReturnStatement,
    PrefixExpression,
    Expression,
    InfixExpression,
    BooleanLiteral,
    IfExpression,
    BlockStatement,
    FunctionLiteral,
    CallExpression,
    Statement
} from "./ast";

test("parses let statments", () => {
    const input = `
    let x = 5;
    let y = 10;
    let foobar = 838383;
    `;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);
    expect(program.statements.length).toBe(3);
    [
        { identifier: "x" },
        { identifier: "y" },
        { identifier: "foobar" }
    ].forEach((expected, i) => {
        const stmt = program.statements[i];
        expect(stmt.tokenLiteral()).toBe("let");
        expect(stmt.constructor.name).toBe(LetStatement.name)
        expect((stmt as LetStatement).name?.tokenLiteral()).toBe(expected.identifier);
    })
});

test("parses let statments 2", () => {
    const tests = [
        { input: "let x = 5;", ident: "x", value: 5 },
        { input: "let y = true;", ident: "y", value: true },
        { input: "let x = foobar;", ident: "x", value: "foobar" },
    ];
    for (const test of tests) {
        const lexer = new Lexer(test.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);
        expect(program.statements.length).toBe(1);
        const stmt = program.statements[0];
        testLetStatement(stmt, test.ident)
        testLiteralExpression((stmt as LetStatement).value, test);
    }
});

test("parses identifier expressions", () => {
    const input = `foobar;`;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);
    const stmt = program.statements[0] as ExpressionStatement;
    expect(stmt.constructor.name).toBe(ExpressionStatement.name)
    const identifier = stmt.expression as Identifier
    expect(identifier.constructor.name).toBe(Identifier.name)
    expect(identifier.value).toBe("foobar");
    expect(identifier.tokenLiteral()).toBe("foobar");
});

test("parses return statments", () => {
    const input = `
    return 5;
    return 10;
    `;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);
    expect(program.statements.length).toBe(2);
    program.statements.forEach((stmt) => {
        expect(stmt.constructor.name).toBe(ReturnStatement.name)
        expect((stmt as ReturnStatement).tokenLiteral()).toBe("return");
    })
});

test("converts to string correctly", () => {
    const program: Program = new Program();
    const letStatement = new LetStatement({ type: Tokens.LET, literal: "let" });
    letStatement.name = new Identifier({ type: Tokens.IDENT, literal: "myVar" }, "myVar");
    letStatement.value = new Identifier({ type: Tokens.IDENT, literal: "anotherVar" }, "anotherVar");
    program.statements = [
        letStatement,
    ]
    expect(program.asString()).toBe("let myVar = anotherVar;")
});

test("parses integer expressions", () => {
    const input = `5;`;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);
    const stmt = program.statements[0] as ExpressionStatement;
    expect(stmt.constructor.name).toBe(ExpressionStatement.name)
    const identifier = stmt.expression as Identifier
    expect(identifier.constructor.name).toBe(IntegerLiteral.name)
    expect(identifier.value).toBe(5);
    expect(identifier.tokenLiteral()).toBe("5");
});

test("parses prefix expressions", () => {
    const tests = [
        { input: "!5", operator: "!", value: 5 },
        { input: "-15", operator: "-", value: 15 },
        { input: "!true", operator: "!", value: true },
        { input: "!false", operator: "!", value: false },
    ]
    for (const test of tests) {
        const lexer = new Lexer(test.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);
        const stmt = program.statements[0] as ExpressionStatement;
        expect(stmt.constructor.name).toBe(ExpressionStatement.name)
        const expr = stmt.expression as PrefixExpression
        expect(expr.constructor.name).toBe(PrefixExpression.name)
        expect(expr.operator).toBe(test.operator);
        testLiteralExpression(expr.right, test);
    }
});

test("parses infix expressions", () => {
    const tests = [
        { input: "5 + 5", left: 5, operator: "+", right: 5 },
        { input: "5 - 5", left: 5, operator: "-", right: 5 },
        { input: "5 * 5", left: 5, operator: "*", right: 5 },
        { input: "5 / 5", left: 5, operator: "/", right: 5 },

        { input: "5 > 5", left: 5, operator: ">", right: 5 },
        { input: "5 < 5", left: 5, operator: "<", right: 5 },
        { input: "5 == 5", left: 5, operator: "==", right: 5 },
        { input: "5 != 5", left: 5, operator: "!=", right: 5 },
    ]
    for (const test of tests) {
        const lexer = new Lexer(test.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);
        const stmt = program.statements[0] as ExpressionStatement;
        expect(stmt.constructor.name).toBe(ExpressionStatement.name);
        const expr = stmt.expression as InfixExpression;
        expect(expr.constructor.name).toBe(InfixExpression.name);
        expectInteger(expr.left, test.left);
        expect(expr.operator).toBe(test.operator);
        expectInteger(expr.right, test.right);
    }
});

test("parses precedences correctly", () => {
    const tests = [
        { input: "5 + 6 + 7", string: "((5 + 6) + 7)" },
        { input: "5 + 6 * 7", string: "(5 + (6 * 7))" },
        { input: "3 > 4 == 4 < 3", string: "((3 > 4) == (4 < 3))" },
        { input: "3 + 4 * 5 == 3 * 1 + 4 * 5", string: "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))" },
        { input: "a + add(b * c) + d", string: "((a + add((b * c))) + d)" },
        { input: "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))", string: "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))" },
    ];

    for (const test of tests) {
        const lexer = new Lexer(test.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);
        expect(program.asString()).toBe(test.string);
    }
});

test("parses grouped correctly correctly", () => {
    const tests = [
        { input: "1 + (2 + 3) + 4", string: "((1 + (2 + 3)) + 4)" },
    ]
    for (const test of tests) {
        const lexer = new Lexer(test.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);
        expect(program.asString()).toBe(test.string);
    }
});

test("parses boolean expressions", () => {
    const tests = [
        { input: "true", expected: true },
        { input: "false", expected: false },
        { input: "false", expected: false },
    ]
    for (const test of tests) {
        const lexer = new Lexer(test.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);
        const stmt = program.statements[0] as ExpressionStatement;
        expect(stmt.constructor.name).toBe(ExpressionStatement.name)
        const expr = stmt.expression as BooleanLiteral;
        expect(expr.constructor.name).toBe(BooleanLiteral.name)
        expect(expr.value).toBe(test.expected)
    }
});

test("parses if expressions", () => {
    const tests = [
        { input: "if (x < y) { x }" },
    ]
    for (const test of tests) {
        const lexer = new Lexer(test.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);
        expect(program.statements.length).toBe(1);
        const stmt = program.statements[0] as ExpressionStatement;
        expect(stmt.constructor.name).toBe(ExpressionStatement.name);
        const expr = stmt.expression as IfExpression;
        expect(expr.constructor.name).toBe(IfExpression.name);
        expect(expr.condition?.asString()).toBe("(x < y)")
        expect(expr.consequence?.asString()).toBe("x")
        expect(expr.consequence?.statements.length).toBe(1)
        const identifier = expr.consequence?.statements[0] as ExpressionStatement;
        expect(identifier?.constructor.name).toBe("ExpressionStatement");
        expect(identifier.expression?.constructor.name).toBe(Identifier.name)
        expect(identifier.expression?.tokenLiteral()).toBe("x");
        expect(expr.alternative).toBe(undefined)
    }
});

test("parses if else expressions", () => {
    const tests = [
        { input: "if (x < y) { x } else { y }" },
    ]
    for (const test of tests) {
        const lexer = new Lexer(test.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);
        expect(program.statements.length).toBe(1);
        const stmt = program.statements[0] as ExpressionStatement;
        expect(stmt.constructor.name).toBe(ExpressionStatement.name);
        const expr = stmt.expression as IfExpression;
        expect(expr.constructor.name).toBe(IfExpression.name);
        expect(expr.condition?.asString()).toBe("(x < y)")
        // if
        expect(expr.consequence?.asString()).toBe("x")
        expect(expr.consequence?.statements.length).toBe(1)
        const identifier = expr.consequence?.statements[0] as ExpressionStatement;
        expect(identifier?.constructor.name).toBe("ExpressionStatement");
        expect(identifier.expression?.constructor.name).toBe(Identifier.name)
        expect(identifier.expression?.tokenLiteral()).toBe("x");
        // Else
        expect(expr.alternative?.asString()).toBe("y")
        expect(expr.alternative?.statements.length).toBe(1)
        expect(expr.alternative?.constructor.name).toBe(BlockStatement.name)
        const altIdentifier = expr.alternative?.statements[0] as ExpressionStatement;
        expect(altIdentifier?.constructor.name).toBe("ExpressionStatement");
        expect(altIdentifier.expression?.tokenLiteral()).toBe("y");
    }
});

test("parses function literal expressions", () => {
    const tests = [
        { input: "fn(x, y) { x + y; }" },
    ]
    for (const test of tests) {
        const lexer = new Lexer(test.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);
        expect(program.statements.length).toBe(1);
        const stmt = program.statements[0] as ExpressionStatement;
        expect(stmt.constructor.name).toBe(ExpressionStatement.name);
        const expr = stmt.expression as FunctionLiteral;
        expect(expr.constructor.name).toBe(FunctionLiteral.name);

        expect(expr.parameters?.length).toBe(2);
        testLiteralExpression(expr.parameters[0], { value: "x" });
        testLiteralExpression(expr.parameters[1], { value: "y" });

        expect(expr.body?.statements.length).toBe(1);
        const bodyStmt = expr.body?.statements[0] as ExpressionStatement
        expect(bodyStmt?.constructor.name).toBe(ExpressionStatement.name);
        expect(bodyStmt?.asString()).toBe("(x + y)");
        const bodyExpr = bodyStmt?.expression as InfixExpression;
        expect(bodyExpr.constructor.name).toBe(InfixExpression.name);
    }
});


test("parses function call expressions", () => {
    const tests = [
        { input: "add(1, 2 * 3, 4 + 5)" },
    ]
    for (const test of tests) {
        const lexer = new Lexer(test.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);
        expect(program.statements.length).toBe(1);
        const stmt = program.statements[0] as ExpressionStatement;
        expect(stmt.constructor.name).toBe(ExpressionStatement.name);
        const expr = stmt.expression as CallExpression;
        expect(expr.constructor.name).toBe(CallExpression.name);

        expectIdentifier(expr.function as Identifier, "add");
        expect(expr.arguments.length).toBe(3);
        testLiteralExpression(expr.arguments[0], { value: 1 })
        expect(expr.arguments[1].asString()).toBe("(2 * 3)")
        expect(expr.arguments[2].asString()).toBe("(4 + 5)")
    }
});

// Helpers
function testLiteralExpression(exp: Expression | undefined, expected: any) {
    switch (typeof (exp as any).value) {
        case "string":
            expectIdentifier(exp as Identifier, expected.value);
            break;
        case "number":
            expectInteger(exp, expected.value);
            break;
        case "boolean":
            expectBoolean(exp, expected.value);
            break
    }
}

function expectInteger(expr: Expression | undefined, expected: number) {
    expect(expr?.constructor.name).toBe(IntegerLiteral.name);
    expect((expr as IntegerLiteral).value).toBe(expected);
}
function expectBoolean(expr: Expression | undefined, expected: boolean) {
    expect(expr?.constructor.name).toBe(BooleanLiteral.name);
    expect((expr as BooleanLiteral).value).toBe(expected);
}

function expectIdentifier(expr: Identifier | undefined, expected: string) {
    expect(expr?.constructor.name).toBe(Identifier.name);
    expect(expr?.value).toBe(expected);
    expect(expr?.tokenLiteral()).toBe(expected);
}
function checkParserErrors(parser: Parser) {
    const errors = parser.getErrors();
    expect(errors).toEqual([]);
}
function testLetStatement(stmt: Statement, value: string) {
    const letStatement = stmt as LetStatement;
    expect(letStatement.constructor.name).toBe(LetStatement.name);
    expect(letStatement.tokenLiteral()).toBe("let");
    expect(letStatement.name?.value).toBe(value);
    expect(letStatement.name?.tokenLiteral()).toBe(value);
}