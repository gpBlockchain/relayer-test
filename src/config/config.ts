import {config} from "@ckb-lumos/lumos";

export const RPC_DEBUG_SERVICE = true
export let CKB_CONFIG = config.predefined.AGGRON4
export let OTHER_SCRIPTS = {
    "ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK": {
        CODE_HASH: '0xea7bedd02d1a7e0092bdba2de5034a707c20718d8c0cbb7682422f4f6fd4e27b',
        HASH_TYPE: 'data1',
        TX_HASH: '0x4eb0f55324c8cb340c2b4442a89a935ed70884fd08db97e9661735c7012fcce8',
        INDEX: '0x1',
        DEP_TYPE: 'code'
    }
}
