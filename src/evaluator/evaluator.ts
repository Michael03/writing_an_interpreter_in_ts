import { MBoolean, MError, MFunction, MInteger, MNull, MObject, MReturn, MString, ObjectTypes } from "../object/object";
import { Node, MNode, NodeTypes, Statement, IfExpression, Expression, LetStatement, Identifier, FunctionLiteral } from "../parser/ast";
import { Environment } from "./environment";
const TRUE = new MBoolean(true);
const FALSE = new MBoolean(false);
export const NULL = new MNull();
export function mEval(node: Node | MNode | undefined, env: Environment): MObject {
    if (node === undefined || !("type" in node)) {
        throw new Error("node missing type");
    }
    switch (node.type) {
        case NodeTypes.Program: ;
            return evalProgram(node.statements, env);
        case NodeTypes.ExpressionStatement:
            return mEval(node.expression, env);
        case NodeTypes.PrefixExpression:
            let prefixRight = mEval(node.right, env);
            if (isError(prefixRight)) {
                return prefixRight;
            }
            return evalPrefixExpression(node.operator as string, prefixRight);
        case NodeTypes.InfixExpression:
            const infixLeft = mEval(node.left, env);
            if (isError(infixLeft)) {
                return infixLeft;
            }
            const infixRight = mEval(node.right, env);
            if (isError(infixRight)) {
                return infixRight;
            }
            return evalInfixExpression(node.operator as string, infixLeft, infixRight) as MObject;
        case NodeTypes.BlockStatement:
            return evalBlockStatements(node.statements, env) as MObject;
        case NodeTypes.ReturnStatement:
            const val = mEval(node.returnValue, env);
            if (isError(val)) {
                return val;
            }
            return new MReturn(val);
        case NodeTypes.IfExpression:
            return evalIfExpression(node, env) as MObject;
        case NodeTypes.LetStatement:
            const letVal = mEval(node.value, env);
            if (isError(letVal)) {
                return letVal;
            }
            if (node.name === undefined) {
                return new MError("node name is undefined in let statement");
            }
            env.set(node.name.value, letVal);
            break;
        case NodeTypes.Identifier:
            return evalIdentifier(node, env)
        case NodeTypes.FunctionLiteral:
            return evalFunctionLiteral(node, env)
        case NodeTypes.CallExpression:
            const func = mEval(node.function, env);
            if (isError(func)) {
                return func;
            }
            const args = evalExpressions(node.arguments, env)
            if (args.length === 1 && isError(args[0])) {
                return args[0];
            }
            return applyFunction(func, args);
        case NodeTypes.IntegerLiteral:
            return new MInteger(node.value);
        case NodeTypes.StringLiteral:
            return new MString(node.value);
        case NodeTypes.BooleanLiteral:
            return node.value ? TRUE : FALSE;
    }
    return NULL;
}

function evalIdentifier(node: Identifier, env: Environment): MObject {
    const val = env.get(node.value);
    if (val === undefined) {
        return new MError(`identifier not found: ${node.value}`);
    }
    return val;
}

function evalBlockStatements(stmts: Statement[], env: Environment) {
    let result: MObject = NULL;
    for (const stmt of stmts) {
        result = mEval(stmt, env);
        if (result != null && (result.type === ObjectTypes.M_RETURN || result.type === ObjectTypes.M_ERROR)) {
            return result;
        }
    }
    return result;
}

function evalProgram(stmts: Statement[], env: Environment) {
    let result: MObject = NULL;
    for (const stmt of stmts) {
        result = mEval(stmt, env);
        if (result.type === ObjectTypes.M_RETURN) {
            return result.value;
        }
        if (result.type === ObjectTypes.M_ERROR) {
            return result;
        }
    }
    return result;
}

function evalPrefixExpression(operator: string, right: MObject) {
    switch (operator) {
        case "!":
            return evalBangOperatorExpression(right);
        case "-":
            if (right.type === ObjectTypes.M_INTEGER) {
                return new MInteger(-(right.value));
            } else {
                return new MError(`unknown operator: ${operator}${right.type}`)
            }
        default:
            return new MError(`unknown operator: ${operator}${right.type}`)
    }
}

function evalInfixExpression(operator: string, left: MObject, right: MObject) {
    if (left.type !== right.type) {
        return new MError(`type mismatch: ${left.type} ${operator} ${right.type}`);
    }
    if (left.type === ObjectTypes.M_INTEGER && right.type === ObjectTypes.M_INTEGER) {
        return evalIntegerInflixExpression(operator, left, right);
    }
    if (left.type === ObjectTypes.M_BOOLEAN && right.type === ObjectTypes.M_BOOLEAN) {
        if (operator == "==") {
            return boolToBoolOBject(left.value == right.value);
        }
        if (operator == "!=") {
            return boolToBoolOBject(left.value != right.value)
        }
    }
    return new MError(`unknown operator: ${left.type} ${operator} ${right.type}`)
}

function evalExpressions(exps: Expression[], env: Environment) {
    const results: MObject[] = [];
    for (const e of exps) {
        const evaluated = mEval(e, env);
        if (isError(evaluated)) {
            return [evaluated];
        }
        results.push(evaluated);
    }
    return results;
}

function evalIntegerInflixExpression(operator: string, left: MInteger, right: MInteger): MObject {
    const leftVal = left.value;
    const rightVal = right.value;
    switch (operator) {
        case "+":
            return new MInteger(Math.floor(leftVal + rightVal));
        case "-":
            return new MInteger(Math.floor(leftVal - rightVal));
        case "*":
            return new MInteger(Math.floor(leftVal * rightVal));
        case "/":
            return new MInteger(Math.floor(leftVal / rightVal));
        case "<":
            return boolToBoolOBject(leftVal < rightVal);
        case ">":
            return boolToBoolOBject(leftVal > rightVal);
        case "==":
            return boolToBoolOBject(leftVal == rightVal);
        case "!=":
            return boolToBoolOBject(leftVal != rightVal);
    }
    return new MError(`unknown operator: ${left.type} ${operator} ${right.type}`);
}

function evalFunctionLiteral(node: FunctionLiteral, env: Environment): MFunction {
    const func = new MFunction();
    func.parameters = node.parameters;
    func.body = node.body;
    return func;
}

function applyFunction(func: MObject, args: MObject[]) {
    if (func.type !== ObjectTypes.M_FUNCTION) {
        return new MError(`not a function ${func.type}`);
    }
    const extendedEnv = extendFunctionEnv(func, args);
    const evaluated = mEval(func.body, extendedEnv);
    return unwrapReturnedValue(evaluated);
}

function evalBangOperatorExpression(right: MObject) {
    switch (right) {
        case TRUE:
            return FALSE;
        case FALSE:
            return TRUE;
        case NULL:
            return TRUE
        default:
            return FALSE;
    }
}

function evalIfExpression(ifExpression: IfExpression, env: Environment) {
    const condition = mEval(ifExpression.condition, env);
    if (isError(condition)) {
        return condition;
    }
    if (isTruthy(condition)) {
        return mEval(ifExpression.consequence, env)
    } else if (ifExpression.alternative) {
        return mEval(ifExpression.alternative, env)
    } else {
        return NULL;
    }
}


function isTruthy(condition: MObject) {
    switch (condition) {
        case NULL:
            return false
        case TRUE:
            return true;
        case FALSE:
            return false;
        default:
            return true;
    }
}
function boolToBoolOBject(val: boolean): MBoolean {
    return val ? TRUE : FALSE;
}

function isError(obj: MObject): obj is MError {
    return (obj && obj.type === ObjectTypes.M_ERROR);
}

function extendFunctionEnv(func: MFunction, args: MObject[]): Environment {
    const extendedEnv = new Environment(func.env);
    for (let i = 0; i < func.parameters.length; i++) {
        extendedEnv.set(func.parameters[i].value, args[i])

    }
    return extendedEnv;
}

function unwrapReturnedValue(obj: MObject) {
    if (obj.type === ObjectTypes.M_RETURN) {
        return obj.value;
    }
    return obj;
}