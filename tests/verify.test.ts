import {configUpdate, pollVerify, step} from "./utils/util";
import {account1_private, CKB_RPC_URL, eth_provider, VERIFIER_RPC_URL} from "./config/config";
import {forceRelayGetForceRelayCkbTransaction} from "../src/service/verifierService";
import {OTHER_SCRIPTS} from "../src/config/config";
import {
    estimate_cycles,
    generateAccountFromPrivateKey,
    signTransaction,
} from "../src/service/txService";
import {deployContractByPath, DeployType} from "../src/service/deploy";
import {helpers} from "@ckb-lumos/lumos";
import {buildTransactionWithTxType} from "../src/service/transfer";
import {toCellDep} from "@ckb-lumos/rpc/lib/resultFormatter";
import {EthLightClientBusinessContract} from "../src/service/contract/ethLightClientBusinessContract";
import {expect} from "chai";

describe('Full Process', function () {
    this.timeout(1000_0000)
    let randTxHash
    before(async () => {
        // await step("Start relay and verify using docker-compose", async () => {
        //     if (!(await configUpdate())) {
        //         throw new Error("configUpdate failed")
        //     }
        //     console.log("services start success!!")
            if (!(await pollVerify(randTxHash, 10000))) {
                throw new Error("pollVerify failed")
            }
        //     console.log("verifier rpc start success!!")
        // })
        await step("get latest hash", async () => {
            randTxHash = await getLatestHashByBlockNum(-1)
            console.log('rand hash:',randTxHash)
        })
        await step("Get information of verify verification contract", async () => {
            let checkVerify = false;

            await step("Check if the verify verification contract is deployed", async () => {

                if (OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK != undefined) {
                    checkVerify = true;
                }

            })

            if (checkVerify) {
                console.log("already deployed")
                return;
            }
            await step("If not deployed, deploy verify verification contract", async () => {
                // todo:  fix deploy contract failed
                const scriptConfig = await deployContractByPath(CKB_RPC_URL, account1_private, "./data/all-contracts/eth_light_client-client_type_lock", DeployType.typeId)
                console.log("scriptConfig:", scriptConfig)
                OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.CODE_HASH = scriptConfig.CODE_HASH
                OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.INDEX = scriptConfig.INDEX
                OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.HASH_TYPE = scriptConfig.HASH_TYPE
                OTHER_SCRIPTS.ETH_LIGHT_CLIENT_BUSINESS_TYPE_LOCK.DEP_TYPE = scriptConfig.DEP_TYPE
            })
        })
    })

    describe('forcerelay_getForcerelayCkbTransaction', function () {
        let verifyRange;
        before(async () => {
            await step("Get the range of transactions that verify can verify", async () => {
                try {
                    /**
                     * query not exist hash will return error msg for  verify range
                     */
                    await forceRelayGetForceRelayCkbTransaction(VERIFIER_RPC_URL, randTxHash);
                } catch (e) {
                    const regex = /\[(\d+),\s*(\d+)\]/;
                    const matches = e.toString().match(regex);
                    if (matches) {
                        const start = matches[1];
                        const end = matches[2];
                        console.log(`verify range:[${start}, ${end}]`);  // 输出 [16736036, 16746926]
                        verifyRange = [Number(start), Number(end)]
                    } else {
                        console.log(`未匹配到内容,err:${e}`);
                    }
                }
            })

        })
        it("Verify a tx on eth using ckb=>should succ", async () => {
            let txs;
            await step("Get the hash of an eth transaction within the range of transactions verify can verify", async () => {
                for (let i = verifyRange[0]; i <= verifyRange[1]; i++) {
                    txs = await eth_provider.getBlock(verifyRange[0]).then((block) => {
                        return block.transactions
                    }).catch((error) => {
                        console.error(error);
                    });
                    if (txs.length > 1) {
                        return
                    }
                }
            })

            let proofTx;
            let idx = 0;
            await step("Get the proof of the transaction through verify", async () => {
                proofTx = await forceRelayGetForceRelayCkbTransaction(VERIFIER_RPC_URL, txs[idx])
            })

            let ckbTx;
            let proofTxMap = JSON.parse(JSON.stringify(proofTx))
            let cellDeps = proofTxMap["cell_deps"].map(dep => toCellDep(dep))

            await step("Construct a ckb transaction using the obtained proof", async () => {
                let txSkeleton = helpers.TransactionSkeleton({});
                txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => cellDeps.push(...proofTxMap["cell_deps"].map(dep => toCellDep(dep))))
                txSkeleton = txSkeleton.update("witnesses", (wits) => wits.push(...proofTxMap["witnesses"]))
                ckbTx = await buildTransactionWithTxType(
                    txSkeleton,
                    {
                        from: generateAccountFromPrivateKey(account1_private).address,
                        ckbUrl: CKB_RPC_URL,
                        outputCells: [await EthLightClientBusinessContract.getOutPutCell({
                            address: generateAccountFromPrivateKey(account1_private).address,
                            // todo cell need 158 ,auto calculate cell need the smallest capacity
                            amount: "158"
                        }, {
                            ckbRpc: CKB_RPC_URL,
                            //  todo check  forcerelay_getForcerelayCkbTransaction -> deps[0] == ibcScriptDep && ibcScriptDep[1] == verifyScriptDep
                            ibcScriptDep: cellDeps[1],
                            verifyScriptDep: cellDeps[0],
                        })],
                        deps: [EthLightClientBusinessContract.getDepsCell()]
                    }
                )
                ckbTx = signTransaction(ckbTx, account1_private)

            })
            console.log(JSON.stringify(ckbTx))

            await step("esGas tx", async () => {
                const cycleResponse = await estimate_cycles(CKB_RPC_URL, ckbTx)
                console.log(cycleResponse)
            })

            // let txHash;
            // await step("Send the ckb transaction and get the transaction hash", async () => {
            //     txHash = await RPCClient.sendTransaction(ckbTx, "passthrough")
            //
            // })

            // await step("Check if the transaction is on the chain", async () => {
            //     const response = await waitTransactionCommit(txHash, CKB_RPC_URL, 100)
            //     expect(response.tx_status.status).to.be.equal("committed")
            // })
        })
        it("txHash is 0x1234 ", async () => {
            const txHash = "0x1234"
            let errMsg;
            await step("query txHash ", async () => {
                try {
                    const result = await forceRelayGetForceRelayCkbTransaction(VERIFIER_RPC_URL, txHash)
                } catch (e) {
                    errMsg = e.toString()
                }
            })
            await step("compare err", async () => {
                expect(errMsg).to.be.includes("Invalid input length")
            })
        })
        it('txhash is not in eth=> error: cannot find transaction hash', async () => {
            const txHash = "0xfdcd00aaf7b81f486ae1f818cb406fdaacb5f7f677cfaf971156556e4fdf4c99"
            let errMsg;
            await step("query txHash ", async () => {
                try {
                    const result = await forceRelayGetForceRelayCkbTransaction(VERIFIER_RPC_URL, txHash)
                } catch (e) {
                    errMsg = e.toString()
                }
            })
            await step("compare err", async () => {
                expect(errMsg).to.be.includes("cannot find transaction hash")
            })
        });
        it('txhash is in range[0] -1', async () => {
            let hashOutOfRange0;
            await step("get hash in range[0] -1", async () => {
                hashOutOfRange0 = await getLatestHashByBlockNum(verifyRange[0] - 1)
            })
            let errMsg
            await step("query txHash ", async () => {
                try {
                    const result = await forceRelayGetForceRelayCkbTransaction(VERIFIER_RPC_URL, hashOutOfRange0)
                } catch (e) {
                    errMsg = e.toString()
                }
            })
            await step("compare err", async () => {
                expect(errMsg).to.be.includes("out of workable range", errMsg)
            })
        })

        it('txHash is in  range[0]', async () => {
            let hashInRange0;
            await step("get hash in range[0]", async () => {
                hashInRange0 = await getLatestHashByBlockNum(verifyRange[0])
            })
            await step("query txHash ", async () => {
                const result = await forceRelayGetForceRelayCkbTransaction(VERIFIER_RPC_URL, hashInRange0)
                console.log("result:", result)
            })
        })
        it('txHash is in  range[1]', async () => {
            let hashInRange0;
            for (let i = 0; i < 5; i++) {
                await step("Get the range of transactions that verify can verify", async () => {
                    try {
                        /**
                         * query not exist hash will return error msg for  verify range
                         */
                        await forceRelayGetForceRelayCkbTransaction(VERIFIER_RPC_URL, randTxHash);
                    } catch (e) {
                        const regex = /\[(\d+),\s*(\d+)\]/;
                        const matches = e.toString().match(regex);
                        if (matches) {
                            const start = matches[1];
                            const end = matches[2];
                            console.log(`verify range:[${start}, ${end}]`);  // 输出 [16736036, 16746926]
                            verifyRange = [Number(start), Number(end)]
                        } else {
                            console.log(`未匹配到内容,err:${e}`);
                        }
                    }
                })

                await step("get hash in range[1]", async () => {
                    hashInRange0 = await getLatestHashByBlockNum(verifyRange[1])
                })
                try {
                    await step("query txHash ", async () => {
                        const result = await forceRelayGetForceRelayCkbTransaction(VERIFIER_RPC_URL, hashInRange0)
                        console.log("result:", result)
                    })
                }catch (e){
                    if (e.toString().includes("please wait a while")){
                        console.log('continue:',e)
                        continue
                    }
                    throw Error(e)
                }
            }
        })
        it('txhash is range[1] +1', async () => {
            let hashInRange0;
            await step("get hash in range[1]+1", async () => {
                hashInRange0 = await getLatestHashByBlockNum(verifyRange[1] + 1)
            })
            let errMsg;
            await step("query txHash ", async () => {
                try {
                    await forceRelayGetForceRelayCkbTransaction(VERIFIER_RPC_URL, hashInRange0)
                }catch (e){
                    errMsg = e.toString()
                }
            })
            await step("err msg eq",async ()=>{
                console.log(`errMsg:${errMsg}`)
                expect(errMsg).to.be.includes("out of workable range")
            })
        })
        it.skip('query in ibc-cell update', async () => {
            // 一直查询知道cell更新，导致报错
            let hashInRange0;
            await step("get hash in range[0]", async () => {
                hashInRange0 = await getLatestHashByBlockNum(verifyRange[0])
            })
            for (let i = 0; i < 100000; i++) {
                await step("query txHash ", async () => {
                    const result = await forceRelayGetForceRelayCkbTransaction(VERIFIER_RPC_URL, hashInRange0)
                    console.log("result:", result)
                })
            }

        })
    });


});

/**
 * This function returns the latest transaction hash by block number.
 *  If blockNum is -1, it gets the latest block number using eth_provider and uses it as blockNum.
 *  @param blockNum - the block number for which to get the latest transaction hash (-1: latest)
 *  @returns a Promise that resolves to a string, which is the hash of the latest transaction in the specified block number.
 *  @throws an Error if no transaction is found for the specified block number.
 */
async function getLatestHashByBlockNum(blockNum: number): Promise<string> {
    if (blockNum === -1) {
        blockNum = await eth_provider.getBlockNumber();
    }
    let txs
    for (let i = blockNum; i > 0; i--) {
        txs = await eth_provider.getBlock(blockNum).then((block) => {
            return block.transactions
        }).catch((error) => {
            console.error(error);
        });
        if (txs.length > 1) {
            return txs[0]
        }
    }
    throw new Error(`not found tx for number :${blockNum}`)
}
