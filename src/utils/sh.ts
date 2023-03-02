import {exec} from "child_process";
import * as child_process from 'child_process';


export async function shWithTimeout(cmd: string, timeout: number) {
    console.log("[sh]:",cmd)
    return new Promise(function (resolve, reject) {
        exec(cmd, {timeout: timeout}, (err, stdout, stderr) => {
            if (err) {
                // c.kill()
                reject(err);
            } else {
                console.log('[sh:response]', stdout)
                resolve({stdout, stderr});
            }
        });
    });
}

export async function sh(cmd: string) {
    return await shWithTimeout(cmd, 10000)

}

export function shSync(cmd: string) {
    console.log(cmd);
    return child_process.execSync(cmd);
}

export async function sleep(timeOut: number) {
    await new Promise(r => setTimeout(r, timeOut));
}

