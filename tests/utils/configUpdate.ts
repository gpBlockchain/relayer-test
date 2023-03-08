import {path, rootPath} from "../config/config";
import {sh} from "../../src/utils/sh";
import {checkLightCellExist, getRandomNum} from "./util";
import fetch from "node-fetch";

it("test",async function (){
    this.timeout(1000_10000)
    const startCmdPath = path.join(rootPath, '/data/checkpointUpdate/');
    const response = await fetch('https://beacon-nd-995-871-887.p2pify.com/c9dce41bab3e120f541e4ffb748efa60/eth/v1/beacon/light_client/finality_update');
    const res = await response.json();
    console.log(res);
    console.log(res.data.finalized_header.slot);
    const response1 = await fetch(`https://beacon-nd-995-871-887.p2pify.com/c9dce41bab3e120f541e4ffb748efa60/eth/v1/beacon/headers/${res.data.finalized_header.slot}`);
    const res1 = await response1.json();
    console.log(res1);
    console.log(`root:${res1.data.root}`);
    const relayerConfigPath = path.join(rootPath, '/data/checkpointUpdate/data/relayer/');
    const verifierConfigPath = path.join(rootPath, '/data/checkpointUpdate/data/verify/');
    const keyWord = await sh(`cd ${relayerConfigPath} && sed -ig s/0xa179cbd497b112acb057039601a75e2daafae994aa5f01d6e1a1d6f85e07a8ef/${res1.data.root}/g config.toml`);
    console.log(JSON.stringify(keyWord));
    const keyWord2 = await sh(`cd ${verifierConfigPath} && sed -ig s/0x21fe8d06dd0ad783a16a09b23aa7d90f65bf77b1bdb1ec4a7091e1867aebcc8a/${res1.data.root}/g helios.toml`);
    console.log(JSON.stringify(keyWord2));
    const randomId = getRandomNum(2, 100);
    console.log(`randomId:${randomId}`);
    const keyWord3 = await sh(`cd ${relayerConfigPath} && sed -ig s/'ibc-ckb-1'/'ibc-ckb-${randomId}'/g config.toml`);
    console.log(`exec config.toml:${keyWord3}`);
    const keyWord4 = await sh(`cd ${verifierConfigPath} && sed -ig s/'ibc-ckb-1'/'ibc-ckb-${randomId}'/g helios.toml`);
    console.log(`exec verifier.toml:${keyWord4}`);
    const keyWord5 = await sh(`cd ${relayerConfigPath} && sed -ig s/'ibc-ckb-1'/'ibc-ckb-${randomId}'/g entrypoint.sh`);
    console.log(`exec entrypoint.sh:${keyWord5}`);

    console.log(`first start relay`);
    const keyWord6 = await sh(`cd ${startCmdPath} && bash start.sh relayer-docker-compose.yml`);
    console.log(`start relayer service:${keyWord6}`);
    if (await checkLightCellExist(`ibc-ckb-${randomId}`, 100)){
        const keyWord7 = await sh(`cd ${startCmdPath} && bash start.sh verifier-docker-compose.yml`);
        console.log(`start verifier service:${keyWord7}`);
    }
})


