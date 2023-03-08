import { beforeEach, it } from "mocha";
import { step } from "./utils/util";
import { path, rootPath } from "./config/config";
import { sh } from "../src/utils/sh";
import { expect } from "chai";

describe('To restart the service and check the block synchronization status', function(){
    this.timeout(1000_000);
    const srcDataPath = path.join(rootPath, "../build/")
    const servRestartPath = path.join(rootPath, 'data/servRestart/');
    beforeEach(async () => {
        await step("env prepare", async() => {
            const status = await sh(`mkdir -p ${servRestartPath} && cp -rf ${srcDataPath} ${servRestartPath}`);
            console.log("+",(JSON.stringify(status)));
        })
    })
    it.skip("restart relay and verifier service", async () => {
        await step("start relay and verifier serv", async() => {
            await sh(`cd ${servRestartPath} && bash prepare.sh && bash start.sh`);
            const relayerStatus = await sh(`docker ps -a | awk '{print $7}' | sed -n '2p'`);
            const verifierStatus = await sh(`docker ps -a | awk '{print $7}' | sed -n '3p'`);
            expect(JSON.stringify(relayerStatus)).to.be.include("UP");
            expect(JSON.stringify(verifierStatus)).to.be.include("UP");
        })
        await step("stop relay and verifier serv", async() => {
            await sh(`cd ${servRestartPath} && bash stop.sh && bash clean.sh`);
            const relayerStatus = await sh(`docker ps -a | awk '{print $7}' | sed -n '2p'`);
            const verifierStatus = await sh(`docker ps -a | awk '{print $7}' | sed -n '3p'`);
            expect(JSON.stringify(relayerStatus)).to.be.include("Exited");
            expect(JSON.stringify(verifierStatus)).to.be.include("Exited");
        })
        await step("restart relay and verifier serv", async() => {
            await sh(`cd ${servRestartPath} && bash prepare.sh && bash start.sh`);
            const relayerStatus = await sh(`docker ps -a | awk '{print $7}' | sed -n '2p'`);
            const verifierStatus = await sh(`docker ps -a | awk '{print $7}' | sed -n '3p'`);
            expect(JSON.stringify(relayerStatus)).to.be.include("UP");
            expect(JSON.stringify(verifierStatus)).to.be.include("UP");
        })
    })

    afterEach(async () => {
        await step("env clear", async() => {
            const status = await sh(`rm -rf  ${servRestartPath}`);
            console.log(status);
        })
    })
});