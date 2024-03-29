import {expect} from "chai";
import {StepInterface} from "allure-js-commons/dist/src/Allure";
import {allure} from "allure-mocha/dist/MochaAllureReporter";
import {path, rootPath, RPCClient, VERIFIER_RPC_URL} from "../config/config";
import {Sleep} from "../../src/utils/util";
import {sh} from "../../src/utils/sh";
import fetch from "node-fetch";
import {forceRelayGetForceRelayCkbTransaction} from "../../src/service/verifierService";

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
    try {
        return await allure.step(name, body)
    } catch (TypeError) {
        if (TypeError.toString().includes("Cannot read properties of undefined (reading 'step')")) {

            return await wrap(body)()
        }
        throw TypeError
    }
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

export function getNewIbcCell() {
    return `ibc-ckb-${getRandomStr()}`;
}
export function getRandomNum(minNum, maxNum) {
    switch (arguments.length) {
        case 1:
            return parseInt(String(Math.random() * minNum + 1), 10);
        case 2:
            return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
        default:
            return 0;
    }
}

export function str2hex(str) {
    if (str === "") {
        return "";
    }
    const arr = [];
    arr.push("0x");
    for (let i = 0; i < str.length; i++) {
        arr.push(str.charCodeAt(i).toString(16));
    }
    return arr.join('');
}

export async function getIbcCellRangeByIbcName(ibcCellName: string): Promise<string[]> {
    if (!await checkLightCellExist(ibcCellName, 10)) {
        throw new Error("wait cell create")
    }

    const ret = await RPCClient.getCells({
            script: {
                codeHash: "0x529dd7087986a7591e0fb860a49111915b8ba68b6c97656bbaafa94b223dcc88",
                hashType: "type",
                args: str2hex(ibcCellName)
            },
            scriptType: 'type'
        }, "asc",
        "0x1",)
    return decodeIbcOutPutData(ret.objects[0].outputData)
}

//0x00205a0000000000ff655a000000000044fcd6ea1b308ac3f3bb5dff17f429f5190b62bf02fbf3a32b35ebfb23acd9d25cf11cafd05ae6eab1a10beccb37632dd9bf99122d75b8475183dd8f6a96c389
// begin : 44fcd6ea1b308ac3f3bb5dff17f429f5190b62bf02fbf3a32b35ebfb23acd9d2
// end: 5cf11cafd05ae6eab1a10beccb37632dd9bf99122d75b8475183dd8f6a96c389
// [begin,end]
function decodeIbcOutPutData(outputDatum: string) {

    console.log(outputDatum.length)
    return [`0x${outputDatum.substr(34, 64)}`, `0x${outputDatum.substr(98)}`]
}

export async function checkLightCellExist(cellName: string, tryCount: number): Promise<boolean> {
    for (let i = 0; i < tryCount; i++) {
        const ret = await RPCClient.getCells({
                script: {
                    codeHash: "0x529dd7087986a7591e0fb860a49111915b8ba68b6c97656bbaafa94b223dcc88",
                    hashType: "type",
                    args: str2hex(cellName)
                },
                scriptType: 'type'
            }, "asc",
            "0x1",)
        console.log(`ret.objects:`, JSON.stringify(ret.objects))
        if (ret.objects.length === 1 && ret.objects[0].output.type.args === str2hex(cellName)) {
            console.log("find it ")
            return true;
        }
        await Sleep(1000)
    }
    return false
}

export async function configUpdate(): Promise<boolean> {
    const startCmdPath = path.join(rootPath, '/data/checkpointUpdate/');
    const response = await fetch('https://beacon-nd-995-871-887.p2pify.com/c9dce41bab3e120f541e4ffb748efa60/eth/v1/beacon/light_client/finality_update');
    const res = await response.json();
    console.log(`finality_update:${res}`);
    console.log(`finalized_header_slot:res.data.finalized_header.slot`);
    const response1 = await fetch(`https://beacon-nd-995-871-887.p2pify.com/c9dce41bab3e120f541e4ffb748efa60/eth/v1/beacon/headers/${res.data.finalized_header.slot}`);
    const res1 = await response1.json();
    console.log(res1);
    console.log(`root:${res1.data.root}`);
    const relayerConfigPath = path.join(rootPath, '/data/checkpointUpdate/data/relayer/');
    const verifierConfigPath = path.join(rootPath, '/data/checkpointUpdate/data/verify/');
    const keyWord = await sh(`cd ${relayerConfigPath} && sed -ig s/0xa179cbd497b112acb057039601a75e2daafae994aa5f01d6e1a1d6f85e07a8ef/${res1.data.root}/g config.toml`);
    console.log(JSON.stringify(keyWord));
    const randomId = getRandomNum(2, 10000);
    console.log(`randomId:${randomId}`);
    const keyWord3 = await sh(`cd ${relayerConfigPath} && sed -ig s/'ibc-ckb-1'/'ibc-ckb-${randomId}'/g config.toml`);
    console.log(`exec config.toml:${keyWord3}`);
    const keyWord4 = await sh(`cd ${verifierConfigPath} && sed -ig s/'ibc-ckb-1'/'ibc-ckb-${randomId}'/g helios.toml`);
    console.log(`exec verifier.toml:${keyWord4}`);
    const keyWord5 = await sh(`cd ${relayerConfigPath} && sed -ig s/'ibc-ckb-1'/'ibc-ckb-${randomId}'/g entrypoint.sh`);
    console.log(`exec entrypoint.sh:${keyWord5}`);

    console.log(`first start relay`);
    const keyWord6 = await sh(`cd ${startCmdPath} && nohup bash start.sh relayer-docker-compose.yml > relay.log 2>&1 &`);
    console.log(`start relayer service:${keyWord6}`);
    if (await checkLightCellExist(`ibc-ckb-${randomId}`, 300)) {
        const hashRanges = await getIbcCellRangeByIbcName(`ibc-ckb-${randomId}`)
        const keyWord2 = await sh(`cd ${verifierConfigPath} && sed -ig s/0x21fe8d06dd0ad783a16a09b23aa7d90f65bf77b1bdb1ec4a7091e1867aebcc8a/${hashRanges[0]}/g helios.toml`);
        console.log(JSON.stringify(keyWord2));
        const keyWord7 = await sh(`cd ${startCmdPath} && nohup bash start.sh verifier-docker-compose.yml > verify.log 2>&1 &`);
        await waitDockerUp("checkpointupdate_verify-client", 600, 20)
        console.log(`start verifier service:${keyWord7}`);
        // check service start
        return true;
    }
    return false;
}

export async function pollVerify(randTxHash, count): Promise<boolean> {
    for (let i = 0; i < count; i++) {
        try {
            await Sleep(1000);
            const res = await forceRelayGetForceRelayCkbTransaction(VERIFIER_RPC_URL, randTxHash);
            console.log("pollVerify succ:",res)
            return true;
        } catch (e) {
            console.log(`e:${e}`);//FetchError: request to http://localhost:8555/ failed, reason: connect ECONNREFUSED 127.0.0.1:8555
            if (!(e.toString().includes("FetchError") || e.toString().includes("please wait"))) {
                console.log("pollVerify succ")
                return true;
            }
        }
    }
    return false;
}

export async function waitDockerUp(dockerName: string, waitCount, upTime: number) {
    let upStatus = false;
    for (let i = 0; i < waitCount; i++) {
        await Sleep(1000)
        if (await checkDockerUp(dockerName)) {
            // 启动阶段
            upStatus = true;
            upTime--;
            waitCount++;
            if (upTime < 0) {
                // 持续启动 upTime 说明启动成功
                console.log(`'START SERVICE:${dockerName} SUCCESS!!'`)
                return
            }
            continue;
        }

        if (upStatus == true) {
            //表示docker启动一段时间后退出
            // const logs = await getLogByDockerName(dockerName)
            // console.log('logs:', logs)
            throw new Error("start failed")

        }
    }
    // const logs = await getLogByDockerName(dockerName)
    // console.log('logs:', logs)
    throw new Error("start failed")

}

export async function checkDockerUp(dockerName: string): Promise<boolean> {
    try {
        let ret = await sh(`docker ps -a`)
        console.log("ret:",ret)
        ret = await sh(`docker ps -a | grep ${dockerName}`)
        // 检查do
        console.log(ret)
        if (JSON.stringify(ret).includes("Up")) {
            console.log("is up ")
            return true;
        }
        return true;
    }catch (e){
        console.log(e)
        return false;
    }

}

async function getLogByDockerName(dockerName: string): Promise<string> {
    // @ts-ignore
    return (await sh(`docker logs ${dockerName}`))
}

export function switchCase<T>(
    value: T,
    cases: Record<string | number | symbol, () => any>,
    defaultCase?: () => any
): any {
    //@ts-ignore
    const caseFn = cases[value];
    if (caseFn) {
        return caseFn();
    }
    if (defaultCase) {
        return defaultCase();
    }
    throw new Error(`Unhandled Type: ${value}`);
}
