import { MBuiltin, MInteger, MString } from "../object/object";

export const builtin = {
    "len": new MBuiltin(
        (ob: MString) => {
            return new MInteger(ob.value.length);
        })

}