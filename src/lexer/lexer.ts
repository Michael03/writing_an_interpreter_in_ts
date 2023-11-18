import { Token, TokenType, Tokens } from "./types";

export class Lexer {
    input: string = "";
    position: number = 0;
    readPosition: number = 0;
    ch: string = "";

    constructor(input: string) {
        this.input = input;
        this.readChar();
    }

    nextToken(): Token {
        // return this.readChar() as any as Token;
        let token: Token = {
            type: Tokens.ILLEGAL,
            literal: ""
        };
        this.skipWhitespace();
        switch (this.ch) {
            case "=":
                if (this.peekChar() === "=") {
                    const char = this.ch;
                    this.readChar();
                    token = newToken(Tokens.EQ, char + this.ch);
                } else {
                    token = newToken(Tokens.ASSIGN, this.ch)
                }
                break;
            case "+":
                token = newToken(Tokens.PLUS, this.ch)
                break;
            case "(":
                token = newToken(Tokens.LPAREN, this.ch)
                break;
            case ")":
                token = newToken(Tokens.RPAREN, this.ch)
                break;
            case "{":
                token = newToken(Tokens.LBRACE, this.ch)
                break;
            case "}":
                token = newToken(Tokens.RBRACE, this.ch)
                break;
            case ",":
                token = newToken(Tokens.COMMA, this.ch)
                break;
            case ";":
                token = newToken(Tokens.SEMICOLON, this.ch)
                break;
            case "!":
                if (this.peekChar() === "=") {
                    const char = this.ch;
                    this.readChar();
                    token = newToken(Tokens.EQ, char + this.ch);
                } else {
                    token = newToken(Tokens.BANG, this.ch)
                }
                break;
            case "-":
                token = newToken(Tokens.MINUS, this.ch)
                break;
            case "/":
                token = newToken(Tokens.SLASH, this.ch)
                break;
            case "*":
                token = newToken(Tokens.ASTERISK, this.ch)
                break;
            case "<":
                token = newToken(Tokens.LT, this.ch)
                break;
            case ">":
                token = newToken(Tokens.GT, this.ch)
                break;
            case '"':
                token = newToken(Tokens.STRING, this.readString())
                break;
            case "":
                token = newToken(Tokens.EOF, "");
                break;
            default:
                if (this.isLetter(this.ch)) {
                    token.literal = this.readIdentifier();
                    token.type = this.lookupIdentifier(token.literal);
                    return token;
                } else if (this.isDigit(this.ch)) {
                    token.literal = this.readDigits();
                    token.type = Tokens.INT;
                    return token;
                } else {
                    throw new Error(`Unknow character ${this.ch}`)
                }
        }
        this.readChar();
        return token;
    }

    private readChar() {
        if (this.readPosition >= this.input.length) {
            this.ch = "";
        } else {
            this.ch = this.input[this.readPosition];
        }
        this.position = this.readPosition;
        this.readPosition++;
    }

    private peekChar(): string {
        if (this.readPosition >= this.input.length) {
            return "";
        } else {
            return this.input[this.readPosition];
        }
    }

    private isLetter = (char: string) => /[a-zA-Z_]/.test(char)
    private isDigit = (char: string) => /[0-9]/.test(char)

    private lookupIdentifier = (ident: string) => {
        const identifiers = {
            "fn": Tokens.FUNCTION,
            "let": Tokens.LET,
            "return": Tokens.RETURN,
            "true": Tokens.TRUE,
            "false": Tokens.FALSE,
            "if": Tokens.IF,
            "else": Tokens.ELSE
        };
        if (ident in identifiers) {
            return identifiers[ident as keyof typeof identifiers];
        }
        return Tokens.IDENT;
    }

    private readDigits = () => {
        const start = this.position;
        while (this.isDigit(this.ch)) {
            this.readChar();
        }
        return this.input.slice(start, this.position);
    }

    private readIdentifier = () => {
        const start = this.position;
        while (this.isLetter(this.ch)) {
            this.readChar();
        }
        return this.input.slice(start, this.position);
    }

    private skipWhitespace = () => {
        while (/\s/.test(this.ch)) {
            this.readChar();
        }
    }

    private readString = () => {
        const position = this.position + 1;
        this.readChar();
        while (this.ch !== '"' && this.ch !== "") {
            this.readChar();

        }
        return this.input.slice(position, this.position);
    }
}

function newToken(type: TokenType, literal: string): Token {
    return {
        type,
        literal
    }
}
