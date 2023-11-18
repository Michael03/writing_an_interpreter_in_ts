import { Token } from "../lexer";

export const NodeTypes = {
    Program: "program",
    LetStatement: "let statement",
    IntegerLiteral: "integer literal",
    StringLiteral: "string literal",
    BooleanLiteral: "boolean literal",
    BlockStatement: "block statement",
    ReturnStatement: "return statement",
    ExpressionStatement: "expression statement",
    IfExpression: "if expression",
    Identifier: "identifier",
    PrefixExpression: "prefix expression",
    InfixExpression: "infix expression",
    FunctionLiteral: "function literal",
    CallExpression: "call expression",
} as const;

export type OBJECT_TYPES = (typeof NodeTypes)[keyof typeof NodeTypes];
export type MNode = Program | LetStatement | IntegerLiteral | BooleanLiteral | BlockStatement | ReturnStatement | ExpressionStatement | IfExpression | Identifier | PrefixExpression | InfixExpression | FunctionLiteral | CallExpression | StringLiteral;

export interface Node {
    tokenLiteral(): string;
    asString(): string;
}
export interface Statement extends Node {
    statementNode(): void;
}
export interface Expression extends Node {
    expressionNode(): void;
}

export class Program implements Node {
    readonly type = NodeTypes.Program;
    statements: Statement[] = [];
    tokenLiteral(): string {
        if (this.statements.length > 0) {
            return this.statements[0].tokenLiteral();
        } else {
            return "";
        }
    }
    asString(): string {
        return this.statements.reduce((acc, stmt) => {
            return acc + stmt.asString();
        }, "");
    }
}

export class LetStatement implements Statement {
    readonly type = NodeTypes.LetStatement
    name: Identifier | undefined;
    value: Expression | undefined;

    constructor(private token: Token) { }
    tokenLiteral(): string {
        return this.token.literal;
    }

    asString(): string {
        let result = "";
        result += this.tokenLiteral() + " ";
        if (this.name !== undefined) {
            result += this.name.asString();
        }
        result += " = ";
        if (this.value !== undefined) {
            result += this.value.asString();
        }
        result += ";";
        return result;
    }
    statementNode() { }
}

export class Identifier implements Expression {
    readonly type = NodeTypes.Identifier;

    constructor(
        private token: Token,
        public value: string
    ) { }
    expressionNode() { }
    tokenLiteral(): string {
        return this.token.literal;
    }
    asString(): string {
        return this.value;
    }
}

export class ReturnStatement implements Statement {
    readonly type = NodeTypes.ReturnStatement;

    public returnValue: Expression | undefined
    constructor(
        private token: Token,
    ) { }
    tokenLiteral(): string {
        return this.token.literal;
    }
    asString(): string {
        let result = `${this.tokenLiteral()} `;
        if (this.returnValue !== null) {
            result += this.returnValue;
        }
        result += ";";
        return result;
    }
    statementNode() { }
}

export class ExpressionStatement implements Statement {
    readonly type = NodeTypes.ExpressionStatement;

    public expression: Expression | undefined;
    constructor(
        private token: Token,
    ) { }
    tokenLiteral(): string {
        return this.token.literal;
    }
    asString(): string {
        if (this.expression != null) {
            return this.expression.asString()
        }
        return "";
    }
    statementNode() { }
}

export class IntegerLiteral implements Expression {
    readonly type = NodeTypes.IntegerLiteral;
    constructor(private token: Token, public value: number) { }
    tokenLiteral(): string {
        return this.token.literal;
    }
    asString(): string {
        return this.token.literal;
    }
    expressionNode(): void { }
}

export class StringLiteral implements Expression {
    readonly type = NodeTypes.StringLiteral;
    constructor(private token: Token, public value: string) { }
    tokenLiteral(): string {
        return this.token.literal;
    }
    asString(): string {
        return this.token.literal;
    }
    expressionNode(): void { }
}

export class PrefixExpression implements Expression {
    readonly type = NodeTypes.PrefixExpression;

    public operator: string | undefined;
    public right: Expression | undefined;
    constructor(private token: Token) { }
    tokenLiteral(): string {
        return this.token.literal;
    }
    asString(): string {
        let result = "";
        result += "(";
        result += this.operator;
        result += this.right?.asString();
        result += ")";
        return result;
    }
    expressionNode(): void { }
}

export class InfixExpression implements Expression {
    readonly type = NodeTypes.InfixExpression;

    public left: Expression | undefined;
    public operator: string | undefined;
    public right: Expression | undefined;
    constructor(private token: Token) { }
    tokenLiteral(): string {
        return this.token.literal;
    }
    asString(): string {
        let result = "";
        result += "(";
        result += this.left?.asString();
        result += ` ${this.operator} `;
        result += this.right?.asString();
        result += ")";
        return result;
    }
    expressionNode(): void { }
}

export class IfExpression implements Expression {
    readonly type = NodeTypes.IfExpression;

    public condition: Expression | undefined;
    public consequence: BlockStatement | undefined;
    public alternative: BlockStatement | undefined;
    constructor(private token: Token) { }
    tokenLiteral(): string {
        return this.token.literal;
    }
    asString(): string {
        let result = "";
        result += "if";
        result += this.condition?.asString();
        result += this.consequence?.asString();
        result += " "
        result += this.consequence?.asString();
        result += this.alternative?.asString();
        return result;
    }
    expressionNode(): void { }
}

export class FunctionLiteral implements Expression {
    readonly type = NodeTypes.FunctionLiteral;

    public parameters: Identifier[] = [];
    public body: BlockStatement | undefined;
    constructor(private token: Token) { }
    tokenLiteral(): string {
        return this.token.literal;
    }
    asString(): string {
        const paramsString = this.parameters.map(p => p.asString());
        let result = this.tokenLiteral();
        result += "(";
        result += paramsString.join(", ");
        result += ")"
        result += this.body?.asString();
        return result;
    }
    expressionNode(): void { }
}


export class BlockStatement implements Statement {
    readonly type = NodeTypes.BlockStatement;

    statements: Statement[] = [];
    constructor(private token: Token) { }
    tokenLiteral(): string {
        return this.token.literal
    }
    asString(): string {
        return this.statements.map(s => s.asString()).join("\n")
    }
    statementNode(): void { };
}

export class CallExpression implements Expression {
    readonly type = NodeTypes.CallExpression;

    public function: Expression | undefined;
    public arguments: Expression[] = [];
    constructor(private token: Token) { }
    tokenLiteral(): string {
        return this.token.literal;
    }
    asString(): string {
        const argumentsString = this.arguments.map(a => a.asString());
        let result = "";
        result += this.function?.asString();
        result += "(";
        result += argumentsString.join(", ");
        result += ")"
        return result;
    }
    expressionNode(): void { }
}

export class BooleanLiteral implements Expression {
    readonly type = NodeTypes.BooleanLiteral;

    constructor(private token: Token, public value: boolean) { }
    tokenLiteral(): string {
        return this.token.literal;
    }
    asString(): string {
        return this.token.literal;
    }
    expressionNode(): void { }
}