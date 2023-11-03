import { MInteger, MNull, MObject } from "../object/object";
import { Expression, ExpressionStatement, IntegerLiteral, Node, Program, Statement } from "../parser/ast";

export function mEval(node: Node): MObject {
    switch (node.constructor.name) {
        case Program.name:
            let program = node as Program;
            return evalStatements(program.statements);
        case ExpressionStatement.name:
            let expStmt = node as ExpressionStatement;
            return mEval(expStmt.expression as Expression);
        case IntegerLiteral.name:
            let iLit = node as IntegerLiteral;
            return new MInteger(iLit.value as number);
    }
    return new MNull();
}

function evalStatements(stmts: Statement[]) {
    let result: MObject = new MNull();
    for (const stmt of stmts) {
        result = mEval(stmt);
    }
    return result;
}