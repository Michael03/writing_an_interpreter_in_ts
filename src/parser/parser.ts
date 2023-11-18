import { Lexer, TokenType } from "../lexer";
import { Token, Tokens } from "../lexer";
import { Expression, ExpressionStatement, Identifier, InfixExpression, IntegerLiteral, LetStatement, PrefixExpression, Program, ReturnStatement, Statement, BooleanLiteral, IfExpression, BlockStatement, FunctionLiteral, CallExpression, StringLiteral } from "./ast";

const PRECEDENCE = {
    _: 0,
    LOWEST: 1, //
    EQUALS: 2, // == 
    LESSGREATER: 3, // < or >
    SUM: 4, // + 
    PRODUCT: 5, // *
    PREFIX: 6, // -x or !x
    CALL: 7 // add(x,y)
}

const PRECEDENCE_MAP: Partial<Record<TokenType, typeof PRECEDENCE[keyof typeof PRECEDENCE]>> = {}
PRECEDENCE_MAP[Tokens.EQ] = PRECEDENCE.EQUALS;
PRECEDENCE_MAP[Tokens.NEQ] = PRECEDENCE.EQUALS;
PRECEDENCE_MAP[Tokens.LT] = PRECEDENCE.LESSGREATER;
PRECEDENCE_MAP[Tokens.GT] = PRECEDENCE.LESSGREATER;
PRECEDENCE_MAP[Tokens.PLUS] = PRECEDENCE.SUM;
PRECEDENCE_MAP[Tokens.MINUS] = PRECEDENCE.SUM;
PRECEDENCE_MAP[Tokens.SLASH] = PRECEDENCE.PRODUCT;
PRECEDENCE_MAP[Tokens.ASTERISK] = PRECEDENCE.PRODUCT;
PRECEDENCE_MAP[Tokens.LPAREN] = PRECEDENCE.CALL;

export class Parser {
    private errors: string[] = [];

    private currentToken!: Token;
    private peekToken!: Token;

    prefixParseFn: Partial<Record<TokenType, Function>> = {};
    infixParseFn: Partial<Record<TokenType, Function>> = {};
    constructor(private lexer: Lexer) {
        this.nextToken();
        this.nextToken();
        this.prefixParseFn[Tokens.IDENT] = this.parseIdentifier;
        this.prefixParseFn[Tokens.INT] = this.parseIntegerLiteral;
        this.prefixParseFn[Tokens.BANG] = this.parsePrefixExpression;
        this.prefixParseFn[Tokens.MINUS] = this.parsePrefixExpression;
        this.prefixParseFn[Tokens.TRUE] = this.parseBooleanLiteral;
        this.prefixParseFn[Tokens.FALSE] = this.parseBooleanLiteral;
        this.prefixParseFn[Tokens.LPAREN] = this.parseGroupedExpression;
        this.prefixParseFn[Tokens.IF] = this.parseIfExpression;
        this.prefixParseFn[Tokens.FUNCTION] = this.parseFunctionLiteral;
        this.prefixParseFn[Tokens.STRING] = this.parseStringLiteral;

        this.infixParseFn[Tokens.PLUS] = this.parseInfixExpression;
        this.infixParseFn[Tokens.MINUS] = this.parseInfixExpression;
        this.infixParseFn[Tokens.SLASH] = this.parseInfixExpression;
        this.infixParseFn[Tokens.ASTERISK] = this.parseInfixExpression;
        this.infixParseFn[Tokens.EQ] = this.parseInfixExpression;
        this.infixParseFn[Tokens.NEQ] = this.parseInfixExpression;
        this.infixParseFn[Tokens.LT] = this.parseInfixExpression;
        this.infixParseFn[Tokens.GT] = this.parseInfixExpression;
        this.infixParseFn[Tokens.LPAREN] = this.parseCallExpression;

    }

    parseProgram(): Program {
        const program = new Program();
        while (this.currentToken.type !== Tokens.EOF) {
            const stmt = this.parseStatement();
            if (stmt) {
                program.statements.push(stmt);
            }
            this.nextToken();
        }

        return program;
    }

    private parseStatement(): Statement | null {
        switch (this.currentToken.type) {
            case Tokens.LET:
                return this.parseLetStatement();
            case Tokens.RETURN:
                return this.parseReturnStatement();
            default:
                return this.parseExpressionStatement();
        }
    }

    private parseLetStatement(): LetStatement | null {
        const stmt = new LetStatement(this.currentToken);
        if (!this.expectPeek(Tokens.IDENT)) {
            return null;
        }
        stmt.name = new Identifier(
            this.currentToken,
            this.currentToken.literal
        )
        if (!this.expectPeek(Tokens.ASSIGN)) {
            return null;
        }
        this.nextToken();
        stmt.value = this.parseExpression(PRECEDENCE.LOWEST);
        if (this.peekTokenIs(Tokens.SEMICOLON)) {
            this.nextToken();
        }
        return stmt;
    }

    private parseReturnStatement(): ReturnStatement | null {
        const stmt = new ReturnStatement(this.currentToken);
        this.nextToken();
        stmt.returnValue = this.parseExpression(PRECEDENCE.LOWEST);
        if (this.peekTokenIs(Tokens.SEMICOLON)) {
            this.nextToken();
        }
        return stmt;
    }

    private parseExpressionStatement(): ExpressionStatement | null {
        const stmt = new ExpressionStatement(this.currentToken);
        stmt.expression = this.parseExpression(PRECEDENCE.LOWEST);
        if (this.peekTokenIs(Tokens.SEMICOLON)) {
            this.nextToken();
        }
        return stmt;

    }

    private parseExpression(precedence: number): Expression | undefined {
        const prefix = this.prefixParseFn[this.currentToken.type];
        if (prefix == null) {

            this.noPrefixParseFnError(this.currentToken.type);
            return undefined;
        }
        let leftExp = prefix();
        while (!this.peekTokenIs(Tokens.SEMICOLON) && precedence < this.peekPrecedence()) {

            let infixFn = this.infixParseFn[this.peekToken.type];
            if (!infixFn) {
                return leftExp;
            }
            this.nextToken();
            leftExp = infixFn(leftExp);
        }
        return leftExp;
    }

    private parseIdentifier = () => {
        return new Identifier(this.currentToken, this.currentToken.literal);
    }

    private parseIntegerLiteral = () => {
        const val = Number.parseInt(this.currentToken.literal, 10);
        if (Number.isNaN(val)) {
            this.errors.push(`Could not parse ${this.currentToken} as number`);
        }
        return new IntegerLiteral(this.currentToken, val);
    }

    private parseStringLiteral = () => {
        return new StringLiteral(this.currentToken, this.currentToken.literal);
    }

    private parseBooleanLiteral = () => {
        return new BooleanLiteral(this.currentToken, this.currTokenIs(Tokens.TRUE))
    }

    private parsePrefixExpression = () => {
        const prefixExp = new PrefixExpression(this.currentToken);
        prefixExp.operator = this.currentToken.literal;
        this.nextToken();
        prefixExp.right = this.parseExpression(PRECEDENCE.PREFIX);
        return prefixExp;
    }

    private parseInfixExpression = (left: Expression) => {
        const prefixExp = new InfixExpression(this.currentToken);
        prefixExp.left = left;
        prefixExp.operator = this.currentToken.literal;
        const precedence = this.curPrecedence();
        this.nextToken();
        prefixExp.right = this.parseExpression(precedence);
        return prefixExp;
    }

    private parseGroupedExpression = () => {
        this.nextToken();
        const exp = this.parseExpression(PRECEDENCE.LOWEST);
        if (!this.expectPeek(Tokens.RPAREN)) {
            return null;
        }
        return exp;
    }

    private parseIfExpression = () => {
        const exp = new IfExpression(this.currentToken);
        if (!this.expectPeek(Tokens.LPAREN)) {
            return null;
        }
        this.nextToken();
        exp.condition = this.parseExpression(PRECEDENCE.LOWEST);
        if (!this.expectPeek(Tokens.RPAREN)) {
            return null;
        }
        if (!this.expectPeek(Tokens.LBRACE)) {
            return null;
        }
        exp.consequence = this.parseBlockStatement();
        if (this.peekTokenIs(Tokens.ELSE)) {
            this.nextToken();
            if (!this.expectPeek(Tokens.LBRACE)) {
                return null;
            }
            exp.alternative = this.parseBlockStatement();
        }
        return exp;
    }

    private parseBlockStatement = () => {
        const block = new BlockStatement(this.currentToken);
        this.nextToken();
        while (!this.currTokenIs(Tokens.RBRACE) && !this.currTokenIs(Tokens.EOF)) {
            console.log("1")
            const stmt = this.parseStatement();
            if (stmt !== null) {
                block.statements.push(stmt);
            }
            this.nextToken();
        }
        return block;
    }

    private parseFunctionLiteral = () => {
        const expr = new FunctionLiteral(this.currentToken);
        if (!this.expectPeek(Tokens.LPAREN)) {
            return null;
        }
        expr.parameters = this.parseFunctionParameters();
        if (!this.expectPeek(Tokens.LBRACE)) {
            return null;
        }
        expr.body = this.parseBlockStatement();
        return expr
    }

    private parseFunctionParameters = (): Identifier[] => {
        const identifiers: Identifier[] = [];
        if (this.peekTokenIs(Tokens.RPAREN)) {
            this.nextToken();
            return identifiers;
        }
        this.nextToken();
        const ident =
            identifiers.push(new Identifier(this.currentToken, this.currentToken.literal));

        while (this.peekTokenIs(Tokens.COMMA)) {
            console.log("2")

            this.nextToken();
            this.nextToken();
            identifiers.push(new Identifier(this.currentToken, this.currentToken.literal));
        };
        if (!this.expectPeek(Tokens.RPAREN)) {
            return [];
        }
        return identifiers;
    }

    private parseCallExpression = (identifier: Expression): CallExpression | null => {
        const callExpr = new CallExpression(this.currentToken);
        callExpr.function = identifier;
        const args = this.parseArguments();
        if (!args) {
            return null;
        }
        callExpr.arguments = args
        return callExpr
    }

    private parseArguments = (): Expression[] | null => {
        const args: Expression[] = [];
        if (this.peekTokenIs(Tokens.RPAREN)) {
            this.nextToken();
            return args;
        }
        this.nextToken();
        let arg = this.parseExpression(PRECEDENCE.LOWEST);
        if (!arg) {
            return null;
        }
        args.push(arg);
        while (this.peekTokenIs(Tokens.COMMA)) {
            console.log("3")

            this.nextToken();
            this.nextToken();
            arg = this.parseExpression(PRECEDENCE.LOWEST);
            if (!arg) {
                return null;
            }
            args.push(arg);
        }
        if (!this.expectPeek(Tokens.RPAREN)) {
            return null;
        }
        return args;
    }


    /**
     * Helper Methods 
     */
    private expectPeek(t: TokenType) {
        if (this.peekTokenIs(t)) {
            this.nextToken();
            return true;
        } else {
            this.peekError(t);
            return false;
        }
    }

    private peekTokenIs(t: TokenType) {
        return this.peekToken.type === t;
    }
    private currTokenIs(t: TokenType) {
        return this.currentToken.type === t;
    }
    private nextToken() {
        this.currentToken = this.peekToken;
        this.peekToken = this.lexer.nextToken();
    }

    private peekPrecedence(): number {
        if (this.peekToken.type in PRECEDENCE_MAP) {
            return PRECEDENCE_MAP[this.peekToken.type]!;
        }
        return PRECEDENCE.LOWEST
    }

    private curPrecedence(): number {
        if (this.currentToken.type in PRECEDENCE_MAP) {
            return PRECEDENCE_MAP[this.currentToken.type]!;
        }
        return PRECEDENCE.LOWEST
    };


    private peekError(t: TokenType) {
        this.errors.push(`Expected next token to be ${t} got ${this.peekToken.type} instead`)
    }
    private noPrefixParseFnError(type: TokenType) {
        this.errors.push(`No prefix parse funcion for ${type}`);
    }
    public getErrors(): string[] {
        return this.errors;
    }


}