import {step} from "./utils/util";
import {sh} from "../src/utils/sh";
import * as fs from "fs";
import * as child_process from 'child_process';
// import path from 'path';

describe('config chainid is error', function () {
    const path = require('path');
    const rootPath = path.resolve(__dirname, '..');
    const configVerifier = path.join(rootPath, 'build/data/verify/helios.toml');
    const startCmd = path.join(rootPath, 'build/start.sh');
    const configVerifierContent = fs.readFileSync(configVerifier, "utf-8");
    it("id is not exist on chain", async () => {
        await step("modify config && start verfier serv", async () => {
            console.log("modify config");
            const ModifyConfigVerifier = child_process.execSync(`echo "${configVerifierContent}" | sed 's/ckb_ibc_client_id = "ibc-ckb-0"/ckb_ibc_client_id = "ibc-ckb-error"/'`);
            const tempModifyConfigVerifier = 'temp.toml';
            fs.writeFileSync(tempModifyConfigVerifier, ModifyConfigVerifier, 'utf-8');
            const outputFilename = 'helios.toml';
            fs.renameSync(tempModifyConfigVerifier, outputFilename);
            console.log("start vrefier serv");
            await sh(`bash ${startCmd}`);
        })
    })
});
