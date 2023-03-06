import {BI, Cell} from "@ckb-lumos/lumos";
import {getLockCell, getLockCellOpt} from "../txService";
import {OTHER_SCRIPTS} from "../../config/config";
import {CellDep} from "@ckb-lumos/lumos";



export class EthLightClientBusinessContract {


    static getOutPutCell(opt: getLockCellOpt): Cell {
        let cell: Cell = getLockCell(opt)
        const ht = OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.HASH_TYPE === "type" ? "type" : "data1";

        function getScriptHash() {
            //todo :适配所有
            //
            //const script: Script = {
            //             codeHash: "0x529dd7087986a7591e0fb860a49111915b8ba68b6c97656bbaafa94b223dcc88",
            //             hashType: "type",
            //             args: "0x6962632d636b622d333135363030"
            //         }
            //         const hash = utils.computeScriptHash(script)
            return "0x0b8940d8c22c031ecbffaf8ce3bdddeb910f9ca2b270467eae3817befeb42ea8".replace("0x","")
        }

        function getVerbinScriptHash() {
            //todo:适配所有
            // https://pudge.explorer.nervos.org/transaction/0x9615315d61193b687bdd9f73d458c46912da4f56d4cd6132b1bf5268f5365423
            //const hahs =  utils.computeScriptHash(
            //            {
            //                codeHash: "0x00000000000000000000000000000000000000000000000000545950455f4944",
            //                hashType: "type",
            //                args: "0xeb871adf5fc97fde4b56ee8b545581147dbb8eb6fdce4fd3d51e8c3618505699"
            //            }
            //        )
            //         console.log("hash:",hahs)
            return "0xbd2d72d5f9e7b8fd9e6d828a8a50d4ed6279f04698c3e5584f16b9e201643972".replace("0x","")
        }

        cell.cellOutput.type = {
            args: `0x${getScriptHash()}${getVerbinScriptHash()}`,
            codeHash: OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.CODE_HASH,
            hashType: ht
        }
        return cell;
    }

    static getDepsCell():CellDep {
        const dt = OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.DEP_TYPE ==="code"?"code":"depGroup";
        return {
            outPoint: {
                txHash:OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.TX_HASH,
                index:OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.INDEX,
            },
            depType: dt,
        }
    }


}
