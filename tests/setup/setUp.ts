import {
    CHECKPOINT_UPDATE_PATH,
    INIT_CKB_IBC, INITIAL_CHECKPOINT,
    RELAYER_CONFIG_PATH, RELAYER_INITIAL_CHECKPOINT, VERIFIER_CHECKPOINT,
    VERIFIER_CONFIG_PATH, VERIFIER_CONTAINER_NAME
} from "../config/config";
import {sh} from "../../src/utils/sh";
import {
    checkLightCellExist,
    getIbcCellRangeByIbcName,
    getNewIbcCell, pollVerify, switchCase,
    waitDockerUp,
} from "../utils/util";
import fetch from "node-fetch";

const myArg  = process.argv[3];
const fixture =switchCase(myArg, {
    "prepare":() => setUp(),
    "clean":() => tearDown()
});
console.log(`"exec ${fixture}"`)


async function cpDockerBuildFiles(tmpPath:string){
    await sh('pwd')
    await sh(`mkdir -p  ${tmpPath} && cp -r build/* ${tmpPath}`)
}

async function getLatestSlotBlockRootHash(){
    //todo replace url
    const response = await fetch('https://beacon-nd-995-871-887.p2pify.com/c9dce41bab3e120f541e4ffb748efa60/eth/v1/beacon/light_client/finality_update');
    const res = await response.json();
    const response1 = await fetch(`https://beacon-nd-995-871-887.p2pify.com/c9dce41bab3e120f541e4ffb748efa60/eth/v1/beacon/headers/${res.data.finalized_header.beacon.slot}`);
    const res1 = await response1.json();
    return res1.data.root
}

export async function setUp(): Promise<String>{
    await cpDockerBuildFiles(CHECKPOINT_UPDATE_PATH);

    const NEW_CKB_IBC = getNewIbcCell();
    console.log(`USE CKB IBC CELL:${NEW_CKB_IBC}`);
    await sh(`cd ${RELAYER_CONFIG_PATH} && sed -ig s/${INIT_CKB_IBC}/${NEW_CKB_IBC}/g config.toml`);
    await sh(`cd ${VERIFIER_CONFIG_PATH} && sed -ig s/${INIT_CKB_IBC}/${NEW_CKB_IBC}/g config.toml`);
    await sh(`cd ${RELAYER_CONFIG_PATH} && sed -ig s/${INIT_CKB_IBC}/${NEW_CKB_IBC}/g entrypoint.sh`);
    // const latestSlotHash = await getLatestSlotBlockRootHash()
    await sh(`cd ${RELAYER_CONFIG_PATH} && sed -ig s/${INITIAL_CHECKPOINT}/${RELAYER_INITIAL_CHECKPOINT}/g config.toml`);
    console.log(`START RELATER SERVICE`);
    await sh(`cd ${CHECKPOINT_UPDATE_PATH} && nohup bash start.sh > relay.log 2>&1 &`);
    // if (await checkLightCellExist(NEW_CKB_IBC, 300)) {
    //     const hashRanges = await getIbcCellRangeByIbcName(NEW_CKB_IBC)
        await sh(`cd ${VERIFIER_CONFIG_PATH} && sed -ig s/${INITIAL_CHECKPOINT}/${VERIFIER_CHECKPOINT}/g config.toml`);
        await sh(`cd ${CHECKPOINT_UPDATE_PATH} && docker-compose start verify-client  &`);
        await waitDockerUp(VERIFIER_CONTAINER_NAME, 600, 20)
        console.log("succ!! ")
        // if(!(await pollVerify("0xe50c04b937af3b6b8647a2e56a1e928258e5af97afa8a987c97f97e547852131",1000))){
        //     return "prepare env fail, please check it!!";
        // }
        return "prepare env succ!!";
    // }
    // return "prepare env fail, please check it!!";
}

//todo
export async function tearDown(): Promise<String> {
    await sh(`cd ${CHECKPOINT_UPDATE_PATH} && docker-compose down`)
    console.log(`pls run :sudo rm -rf ${CHECKPOINT_UPDATE_PATH}`)
    return ""
}

