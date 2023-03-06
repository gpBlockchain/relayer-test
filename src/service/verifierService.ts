import {request} from "../utils/util";

export async function forceRelayGetForceRelayCkbTransaction(rpc,txHash:string):Promise<string>{
    return request(1,rpc,"forcerelay_getForcerelayCkbTransaction",[txHash])
}
