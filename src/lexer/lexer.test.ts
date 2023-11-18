import { test, expect } from "@jest/globals";
import { Tokens, Token } from "./types";
import { Lexer } from "./lexer";



test("lexes simple tokens correctly", () => {
    const input = "=+(){},;";
    const expected: Token[] = [
        { type: Tokens.ASSIGN, literal: "=" },
        { type: Tokens.PLUS, literal: "+" },
        { type: Tokens.LPAREN, literal: "(" },
        { type: Tokens.RPAREN, literal: ")" },
        { type: Tokens.LBRACE, literal: "{" },
        { type: Tokens.RBRACE, literal: "}" },
        { type: Tokens.COMMA, literal: "," },
        { type: Tokens.SEMICOLON, literal: ";" },
    ];
    let lexer = new Lexer(input);

    for (let token of expected) {
        const next = lexer.nextToken();
        expect(next.type).toBe(token.type);
        expect(next.literal === token.literal);
    }
});

test("lexes simple code correctly", () => {
    const input = `let five = 5;
    let ten = 10;

    let add = fn(x,y) {
        x + y;
    };
    
    let result = add(five, ten);
    !-/*5;
    5 < 10 > 5;
    10 == 5;
    10 != 5;
    "foobar";
    "foo bar";
    `;
    const expected: Token[] = [
        { type: Tokens.LET, literal: "let" },
        { type: Tokens.IDENT, literal: "five" },
        { type: Tokens.ASSIGN, literal: "=" },
        { type: Tokens.INT, literal: "5" },
        { type: Tokens.SEMICOLON, literal: ";" },
        { type: Tokens.LET, literal: "let" },
        { type: Tokens.IDENT, literal: "ten" },
        { type: Tokens.ASSIGN, literal: "=" },
        { type: Tokens.INT, literal: "10" },
        { type: Tokens.SEMICOLON, literal: ";" },
        { type: Tokens.LET, literal: "let" },
        { type: Tokens.IDENT, literal: "add" },
        { type: Tokens.ASSIGN, literal: "=" },
        { type: Tokens.FUNCTION, literal: "fn" },
        { type: Tokens.LPAREN, literal: "(" },
        { type: Tokens.IDENT, literal: "x" },
        { type: Tokens.COMMA, literal: "," },
        { type: Tokens.IDENT, literal: "y" },
        { type: Tokens.RPAREN, literal: ")" },
        { type: Tokens.LBRACE, literal: "{" },
        { type: Tokens.IDENT, literal: "x" },
        { type: Tokens.PLUS, literal: "+" },
        { type: Tokens.IDENT, literal: "y" },
        { type: Tokens.SEMICOLON, literal: ";" },
        { type: Tokens.RBRACE, literal: "}" },
        { type: Tokens.SEMICOLON, literal: ";" },
        { type: Tokens.LET, literal: "let" },
        { type: Tokens.IDENT, literal: "result" },
        { type: Tokens.ASSIGN, literal: "=" },
        { type: Tokens.IDENT, literal: "add" },
        { type: Tokens.LPAREN, literal: "(" },
        { type: Tokens.IDENT, literal: "five" },
        { type: Tokens.COMMA, literal: "," },
        { type: Tokens.IDENT, literal: "ten" },
        { type: Tokens.RPAREN, literal: ")" },
        { type: Tokens.SEMICOLON, literal: ";" },
        
        { type: Tokens.BANG, literal: "!" },
        { type: Tokens.MINUS, literal: "-" },
        { type: Tokens.SLASH, literal: "/" },
        { type: Tokens.ASTERISK, literal: "*" },
        { type: Tokens.INT, literal: "5" },
        { type: Tokens.SEMICOLON, literal: ";" },
        { type: Tokens.INT, literal: "5" },
        { type: Tokens.LT, literal: "<" },
        { type: Tokens.INT, literal: "10" },
        { type: Tokens.GT, literal: ">" },
        { type: Tokens.INT, literal: "5" },
        { type: Tokens.SEMICOLON, literal: ";" },
        
        { type: Tokens.INT, literal: "10" },
        { type: Tokens.EQ, literal: "==" },
        { type: Tokens.INT, literal: "5" },
        { type: Tokens.SEMICOLON, literal: ";" },
        { type: Tokens.INT, literal: "10" },
        { type: Tokens.EQ, literal: "!=" },
        { type: Tokens.INT, literal: "5" },
        { type: Tokens.SEMICOLON, literal: ";" },
        { type: Tokens.STRING, literal: "foobar" },
        { type: Tokens.SEMICOLON, literal: ";" },
        { type: Tokens.STRING, literal: "foo bar" },
        { type: Tokens.SEMICOLON, literal: ";" },

        { type: Tokens.EOF, literal: "" },
    ];
    let lexer = new Lexer(input);

    for (let token of expected) {
        const next = lexer.nextToken();
        expect(next.type).toBe(token.type);
        expect(next.literal === token.literal);
    }
});


test("lexes more keywords", () => {
    const input = `
    if( 5 < 10 ) {
        return true;
    } else {
        return false;
    }
    `;
    const expected: Token[] = [
        { type: Tokens.IF, literal: "if" },
        { type: Tokens.LPAREN, literal: "(" },
        { type: Tokens.INT, literal: "5" },
        { type: Tokens.LT, literal: "<" },
        { type: Tokens.INT, literal: "10" },
        { type: Tokens.RPAREN, literal: ")" },
        { type: Tokens.LBRACE, literal: "{" },
        { type: Tokens.RETURN, literal: "return" },
        { type: Tokens.TRUE, literal: "true" },
        { type: Tokens.SEMICOLON, literal: ";" },
        { type: Tokens.RBRACE, literal: "}" },
        { type: Tokens.ELSE, literal: "else" },
        { type: Tokens.LBRACE, literal: "{" },
        { type: Tokens.RETURN, literal: "return" },
        { type: Tokens.FALSE, literal: "false" },
        { type: Tokens.SEMICOLON, literal: ";" },

        { type: Tokens.RBRACE, literal: "}" },
        { type: Tokens.EOF, literal: "" },
    ];
    let lexer = new Lexer(input);

    for (let token of expected) {
        const next = lexer.nextToken();
        expect(next.type).toBe(token.type);
        expect(next.literal === token.literal);
    }
});