export const path = require('path');
export const rootPath = path.resolve(__dirname, '..');
export const CKB_RPC_URL = "https://testnet.ckb.dev/"
export const VERIFIER_RPC_URL = "http://18.162.88.204:8645"
export const ETH_EXEC_RPC_URL = "https://ethereum.blockpi.network/v1/rpc/public"
export const ETH_CONSENS_RPC_URL = "https://beacon-nd-995-871-887.p2pify.com/c9dce41bab3e120f541e4ffb748efa60"
export const account1_private = "0xdd50cac37ec6dd12539a968c1a2cbedda75bd8724f7bcad486548eaabb87fc8b"
import {ethers} from 'ethers';
import {RPC} from "@ckb-lumos/rpc";

export const eth_provider = new ethers.providers.JsonRpcProvider(ETH_EXEC_RPC_URL);
export const RPCClient = new RPC(CKB_RPC_URL);


