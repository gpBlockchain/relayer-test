import {ethers} from "ethers";

export const path = require('path');
export const rootPath = path.resolve(__dirname, '../..');
export const CKB_RPC_URL = "https://testnet.ckb.dev/";
export const VERIFIER_RPC_URL = "http://127.0.0.1:8545";
export const ETH_EXEC_RPC_URL = "https://ethereum.blockpi.network/v1/rpc/public";
export const ETH_CONSENS_RPC_URL = "https://beacon-nd-995-871-887.p2pify.com/c9dce41bab3e120f541e4ffb748efa60";
export const account1_private = "0xdd50cac37ec6dd12539a968c1a2cbedda75bd8724f7bcad486548eaabb87fc8b";
export const FINALITY_UPDATE = "https://beacon-nd-995-871-887.p2pify.com/c9dce41bab3e120f541e4ffb748efa60/eth/v1/beacon/light_client/finality_update";
export const CHECKPOINT_BY_SLOT = "https://beacon-nd-995-871-887.p2pify.com/c9dce41bab3e120f541e4ffb748efa60/eth/v1/beacon/headers/"
export const CHECKPOINT_UPDATE_PATH = path.join(rootPath, '/tmp/checkpointUpdate/');
export const RELAYER_CONFIG_PATH = `${CHECKPOINT_UPDATE_PATH}/data/relayer/`;
export const VERIFIER_CONFIG_PATH = `${CHECKPOINT_UPDATE_PATH}/data/verify/`;
export const INITIAL_CHECKPOINT = "0xa179cbd497b112acb057039601a75e2daafae994aa5f01d6e1a1d6f85e07a8ef";
export const CHECKPOINT = "0x21fe8d06dd0ad783a16a09b23aa7d90f65bf77b1bdb1ec4a7091e1867aebcc8a";
export const INIT_CKB_IBC ='ibc-ckb-1';
export const VERIFIER_CONTAINER_NAME = "checkpointupdate-verify-client";
import {RPC} from "@ckb-lumos/rpc";

export const eth_provider = new ethers.JsonRpcProvider(ETH_EXEC_RPC_URL);
export const RPCClient = new RPC(CKB_RPC_URL);


