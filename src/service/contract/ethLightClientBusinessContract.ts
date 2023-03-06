import {BI, Cell, utils} from "@ckb-lumos/lumos";
import {getLockCell, getLockCellOpt} from "../txService";
import {OTHER_SCRIPTS} from "../../config/config";
import {CellDep} from "@ckb-lumos/lumos";
import {CKB_RPC_URL, RPCClient} from "../../../tests/config/config";
import {RPC} from "@ckb-lumos/rpc";


export interface getLightClientOpt {
    ckbRpc: string,
    ibcScriptDep: CellDep,
    verifyScriptDep: CellDep
}

export class EthLightClientBusinessContract {


    static async getOutPutCell(opt: getLockCellOpt, getArgsOpt: getLightClientOpt): Promise<Cell> {
        let cell: Cell = getLockCell(opt)
        const ht = OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.HASH_TYPE === "type" ? "type" : "data1";

        async function getScriptHash(ckbUrl, cellDep: CellDep) {
            const RPCClient = new RPC(CKB_RPC_URL);
            const tx = await RPCClient.getTransaction(cellDep.outPoint.txHash)
            const script = tx.transaction.outputs[BI.from(cellDep.outPoint.index).toNumber()].type
            if (script == undefined) {
                throw Error("script must not empty!")
            }
            return utils.computeScriptHash(script).replace("0x", "")
        }

        async function getArgs(getArgsOpt: getLightClientOpt) {
            return `0x${await getScriptHash(getArgsOpt.ckbRpc, getArgsOpt.ibcScriptDep)}${await getScriptHash(getArgsOpt.ckbRpc, getArgsOpt.verifyScriptDep)}`;
        }

        cell.cellOutput.type = {
            args: await getArgs(getArgsOpt),
            codeHash: OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.CODE_HASH,
            hashType: ht
        }
        return cell;
    }

    static getDepsCell(): CellDep {
        const dt = OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.DEP_TYPE === "code" ? "code" : "depGroup";
        return {
            outPoint: {
                txHash: OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.TX_HASH,
                index: OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.INDEX,
            },
            depType: dt,
        }
    }


}
