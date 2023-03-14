import {step} from "./utils/util";
import {sh} from "../src/utils/sh";
import { expect } from "chai";
import { path, rootPath } from "./config/config";

describe('config chainid is error', function () {
    this.timeout(1000_0000)
    const startCmdPath = path.join(rootPath, '/data/chainid_error/');
    it("id is not exist on chain, expect Error: forcerelay error: no lightclient cell deployed on ckb", async () => {
        await step("1.start verifier serv", async () => {
            const keyWord = await sh(`cd ${startCmdPath} && bash start.sh`);
            expect(JSON.stringify(keyWord)).to.be.include("Error: forcerelay error: no lightclient cell deployed on ckb",JSON.stringify(keyWord));
        })
    })
});
