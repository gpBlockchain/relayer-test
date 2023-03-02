import {step} from "./utils/util";
import * as fs from "fs";
import * as child_process from 'child_process';
import { assert } from "chai";

describe('config chainid is error', function () {
    const path = require('path');
    const rootPath = path.resolve(__dirname, '..');
    console.log(rootPath);
    const configVerifier = path.join(rootPath, 'build/data/verify/helios.toml');
    const startCmd = path.join(rootPath, 'build/start.sh');
    const configVerifierContent = fs.readFileSync(configVerifier, "utf-8");
    it("id is not exist on chain", async () => {
        await step("1.modify config", async () => {
            console.log("modify config");
            const ModifyConfigVerifier = child_process.execSync(`echo "${configVerifierContent}" | sed 's/ckb_ibc_client_id = "ibc-ckb-0"/ckb_ibc_client_id = "ibc-ckb-error"/'`);
            const tempModifyConfigVerifier = 'temp.toml';
            fs.writeFileSync(tempModifyConfigVerifier, ModifyConfigVerifier, 'utf-8');
            const outputFilename = 'helios.toml';
            fs.renameSync(tempModifyConfigVerifier, outputFilename);
        })
        await step("2.start verfier serv", async () => {
            const keyWord = child_process.execSync(`bash ${startCmd}`);
            assert(keyWord.toString('utf-8') === "no configuration file provided: not found", "check config error not found key words");
        })
    })
});
