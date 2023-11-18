import { createInterface } from "node:readline"
import { stdin as input, stdout as output, exit } from 'node:process'
import { Lexer } from "./lexer";
import { Parser } from "./parser/parser";
import { inspect } from "util";
import { mEval } from "./evaluator/evaluator";
import { Environment } from "./evaluator/environment";

const env = new Environment();
console.log("Starting");
console.log(">>")


const rl = createInterface({ input, output })
const handleLine = (data: string) => {
    if (data === "exit" || data === "") {
        exit(0);
    } else {
        const lexer = new Lexer(data);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        const errors = parser.getErrors();
        if (errors.length > 0) {
            console.error(errors);
        } else {
            console.log(inspect(program, { depth: 10 }));
            console.log(program.asString());
            const obj = mEval(program, env);
            console.log(`result ${JSON.stringify(obj)}`);
            console.log(`result val ${obj.inspect()}`);
        }

    }
}
rl.on('line', handleLine);


