import {
    CHECKPOINT,
    CHECKPOINT_BY_SLOT,
    CHECKPOINT_UPDATE_PATH,
    FINALITY_UPDATE, INIT_CKB_IBC, INITIAL_CHECKPOINT,
    RELAYER_CONFIG_PATH,
    VERIFIER_CONFIG_PATH, VERIFIER_CONTAINER_NAME
} from "../config/config";
import {sh} from "../../src/utils/sh";
import {
    checkLightCellExist,
    getIbcCellRangeByIbcName,
    getNewIbcCell, switchCase,
    waitDockerUp,
} from "../utils/util";
import {getJsonData} from "../../src/utils/util";

const myArg  = process.argv[3];
const fixture =switchCase(myArg, {
    "prepare":() => setUp(),
    "clean":() => tearDown()
});
console.log(`"exec ${fixture}"`)

export async function setUp(): Promise<String>{
    const response = await getJsonData(FINALITY_UPDATE);
    console.log(`GET FINALITY_UPDATE SLOT:${response.data.finalized_header.beacon.slot}`);
    const response1 = await getJsonData(`${CHECKPOINT_BY_SLOT}${response.data.finalized_header.beacon.slot}`);
    console.log(`GET BLOCK ROOT HASH:${response1.data.root}`);
    await sh(`cd ${RELAYER_CONFIG_PATH} && sed -ig s/${INITIAL_CHECKPOINT}/${response1.data.root}/g config.toml`);
    const NEW_CKB_IBC = getNewIbcCell();
    console.log(`USE CKB IBC CELL:${NEW_CKB_IBC}`);
    await sh(`cd ${RELAYER_CONFIG_PATH} && sed -ig s/${INIT_CKB_IBC}/${NEW_CKB_IBC}/g config.toml`);
    await sh(`cd ${VERIFIER_CONFIG_PATH} && sed -ig s/${INIT_CKB_IBC}/${NEW_CKB_IBC}/g helios.toml`);
    await sh(`cd ${RELAYER_CONFIG_PATH} && sed -ig s/${INIT_CKB_IBC}/${NEW_CKB_IBC}/g entrypoint.sh`);
    console.log(`START RELATER SERVICE`);
    await sh(`cd ${CHECKPOINT_UPDATE_PATH} && nohup bash start.sh relayer-docker-compose.yml > relay.log 2>&1 &`);
    if (await checkLightCellExist(NEW_CKB_IBC, 300)) {
        const hashRanges = await getIbcCellRangeByIbcName(NEW_CKB_IBC)
        await sh(`cd ${VERIFIER_CONFIG_PATH} && sed -ig s/${CHECKPOINT}/${hashRanges[0]}/g helios.toml`);
        await sh(`cd ${CHECKPOINT_UPDATE_PATH} && nohup bash start.sh verifier-docker-compose.yml > verify.log 2>&1 &`);
        await waitDockerUp(VERIFIER_CONTAINER_NAME, 600, 20)
        return "prepare env succ!!";
    }
    return "prepare env fail, please check it!!";
}

//todo
export async function tearDown(): Promise<String> {
    return null;
}

