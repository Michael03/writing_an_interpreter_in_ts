export const Tokens = {
    ILLEGAL: "ILLEGAL",
    EOF: "EOF",

    // Identifiers
    IDENT: "IDENT",
    INT: "INT",
    STRING: "STRING",

    // Operators
    ASSIGN: "=",
    PLUS: "+",
    MINUS: "-",
    BANG: "!",
    ASTERISK: "*",
    SLASH: "/",
    LT: "<",
    GT: ">",
    EQ: "==",
    NEQ: "!=",

    // Delimiters
    COMMA: ",",
    SEMICOLON: ";",
    LPAREN: "(",
    RPAREN: ")",
    LBRACE: "{",
    RBRACE: "}",

    // Keywords
    FUNCTION: "FUNCTION",
    LET: "LET",
    RETURN: "RETURN",
    TRUE: "TRUE",
    FALSE: "FALSE",
    IF: "IF",
    ELSE: "ELSE"
} as const;
export type TokenType = (typeof Tokens)[keyof typeof Tokens];
export type Token = {
    type: TokenType,
    literal: string
};

