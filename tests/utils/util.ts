import {expect} from "chai";
import {StepInterface} from "allure-js-commons/dist/src/Allure";
import {allure} from "allure-mocha/dist/MochaAllureReporter";
import {RPCClient} from "../config/config";
import {Sleep} from "../../src/utils/util";

export async function expectedThrow(promise: Promise<any>, msg = "") {
    try {
        await promise
    } catch (err) {
        expect(err.toString()).to.be.include(msg, err.toString())
        return true
    }
    expect.fail(` not expected happen, expected err:${msg}`)
}

export async function step(name: string, body: (step: StepInterface) => any): Promise<any> {
    console.log(`\x1b[33m${name}\x1b[0m`);
    // try {
    //     return await allure.step(name, body)
    // } catch (TypeError) {
    //     if (TypeError.toString().includes("Cannot read properties of undefined (reading 'step')")) {

            return await wrap(body)()
        // }
        // throw TypeError
    // }
}

function wrap<T>(fun: (...args: any[]) => T): any {
    return (...args: any[]): T => {
        let result;
        try {
            result = fun(args);
        } catch (error) {
            throw error;
        }
        if (isPromise(result)) {
            const promise = result as any as Promise<any>;
            return promise
                .then((res) => {
                    return res;
                })
                .catch((error) => {
                    if (error) {
                    }
                    throw error;
                }) as any as T;
        } else {
            return result;
        }
    };
}

const isPromise = (obj: any): boolean =>
    !!obj && (typeof obj === "object" || typeof obj === "function") && typeof obj.then === "function";


export function attachJpeg(name: string, content: Buffer | string) {
    try {
        allure.attachment(name, content, "image/jpeg")
    } catch (TypeError) {
        if (TypeError.toString().includes("Cannot read properties of undefined (reading 'attachment')")) {
            return
        }
        throw TypeError
    }
}

export function attachMessage(name: string, content: string) {
    try {
        allure.attachment(name, content, "text/plain")
    } catch (TypeError) {
        if (TypeError.toString().includes("Cannot read properties of undefined (reading 'attachment')")) {
            return
        }
        throw TypeError
    }
}

export function getBrowserRandomUserPath() {
    return `tmp/${getRandomStr()}`
}

export function getRandomStr() {
    return Math.random().toString(36).slice(-10);
}

export function getRandomNum(minNum, maxNum){
    switch (arguments.length) {
        case 1:
            return parseInt(String(Math.random() * minNum + 1), 10);
        case 2:
            return parseInt(Math.random() * (maxNum-minNum+1)+minNum, 10);
        default:
            return 0 ;
    }
}

export function str2hex(str){
    if(str === ""){
        return "";
    }
    const arr = [];
    arr.push("0x");
    for(let i=0;i<str.length;i++){
        arr.push(str.charCodeAt(i).toString(16));
    }
    return arr.join('');
}

export async function checkLightCellExist(cellName: string, tryCount: number): Promise<boolean> {
    for (let i = 0; i < tryCount; i++) {
        const ret = await RPCClient.getCells({
                script: {
                    codeHash: "0x529dd7087986a7591e0fb860a49111915b8ba68b6c97656bbaafa94b223dcc88",
                    hashType: "type",
                    args:str2hex(cellName)
                },
                scriptType: 'type'
            }, "asc",
            "0x1",)
        if(ret.objects.length == 1 && ret.objects[0].output.type.args == str2hex(cellName)){
            return true;
        }
        await Sleep(1000)
    }
    return false
}
