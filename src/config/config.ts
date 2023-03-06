import {config} from "@ckb-lumos/lumos";

export const RPC_DEBUG_SERVICE = true
export let CKB_CONFIG = config.predefined.AGGRON4
export let OTHER_SCRIPTS = {
    "ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK": {
        CODE_HASH: '0xea7bedd02d1a7e0092bdba2de5034a707c20718d8c0cbb7682422f4f6fd4e27b',
        HASH_TYPE: 'data1',
        TX_HASH: '0xc9356aae056102403ec2c3aa1bdc394419522b84846f73f3aa6b2fdcbac42979',
        INDEX: '0x1',
        DEP_TYPE: 'code'
    }
}
