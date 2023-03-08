import {configUpdate, pollVerify, step} from "./utils/util";
import {account1_private, CKB_RPC_URL, eth_provider, RPCClient, VERIFIER_RPC_URL} from "./config/config";
import {forceRelayGetForceRelayCkbTransaction} from "../src/service/verifierService";
import {OTHER_SCRIPTS} from "../src/config/config";
import {
    estimate_cycles,
    generateAccountFromPrivateKey, getLockCell,
    signTransaction,
} from "../src/service/txService";
import {deployContractByPath, DeployType} from "../src/service/deploy";
import {helpers} from "@ckb-lumos/lumos";
import {buildTransactionWithTxType} from "../src/service/transfer";
import {toCellDep} from "@ckb-lumos/rpc/lib/resultFormatter";
import {EthLightClientBusinessContract} from "../src/service/contract/ethLightClientBusinessContract";
import {blockchain} from "@ckb-lumos/base";
import { sh } from "../src/utils/sh";
import {Sleep} from "../src/utils/util";

describe('Full Process', function () {
    this.timeout(1000_0000)
    let randTxHash = "0xd74af04ccc9f890f43e8ae80da79d3d83f224d2ba0a710c44a73b929dd60e765";
    beforeEach(async () => {
        await step("Start relay and verify using docker-compose", async () => {
            if(await configUpdate()){
                console.log("services start success!!")
                if(await pollVerify(randTxHash, 10000)){
                    console.log("verifier rpc start success!!")
                }
            }
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

    it("Verify a tx on eth using ckb", async () => {
        let verifyRange;

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
                    console.log('未匹配到内容');
                }
            }
        })
        let txs;
        await step("Get the hash of an eth transaction within the range of transactions verify can verify", async () => {
            for (let i = verifyRange[0]; i < verifyRange[1]; i++) {
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

        console.log("proofTx:", proofTx)
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

    it.skip("transfer ver 2 empty", async () => {
        const proofTx = `{"version":"0x0","cell_deps":[{"out_point":{"tx_hash":"0x9615315d61193b687bdd9f73d458c46912da4f56d4cd6132b1bf5268f5365423","index":"0x0"},"dep_type":"code"},{"out_point":{"tx_hash":"0xae657a2397bcd2ffbded6ac7f582abe10254da4fb4c03303f501527469fa6d4e","index":"0x0"},"dep_type":"code"}],"header_deps":[],"inputs":[],"outputs":[],"outputs_data":[],"witnesses":["0x2e1300001000000010000000410d00002d0d00002d0d0000200000009000000098000000b80000007c02000020060000290c000000205a0000000000d33d040000000000bd6c1e097a0491fc0785cf996fec337935f07e07ad5e866625dc463f541345ca2d4ad715484ca282524c33f952198d862c795818ae36d898eff9fbbce09609fa9bd70eb2c19648255e7ecec0a43d191eff883abb34c0dd2188b9bb1a35a2835b00000000000000007e9df3c29fe7f80871fa03d3ca45338ee4b1206f3218ac02e85a00e15752876f0e000000a63ecaa0584b6557086d1a1045a287f4629cac327fb8e11136b5717114590e52921b8dcd1a8997dc276ce2769583b2f4bfa1af5f48327d75e87d6bdfe9b8b445858a7ca81d0ed8c4697e9fda7a71432bf60046040d0948cd177adffdc78fccee7d82995d1cba95ef9c63ab7801d0c0ec94ea4f7e2d39bebe7c5ded442f696fa6bb171985c4f7f6a168d434a8a2a9cb47a39a20510820fa7dfc420367f9e3aea15f9f0f35eae02e4f96700d96f1e9c9b15a7737591c0625d89da9461ec95cbff534854b3ba5babdeeccb2e1e2de53bef80ab489e5e38e6e6486ab267e1008febf30dc40ef78b6ff76b9f903670c76a539757603fd184adfdc25ee477b03729052ca7f4be522a6a694e3df3f87fe396e001df1f555317ddcb09499c373bc2865fdc99680b27c1a1847595d48fc44b5654cad11d6a2fd74d8a30e47fa0a6d58b37c033bd752b1687cb38ce3dd8591a5ca1430b9a79abdb9ea2d8760cd387edc0e58fec6db9b7ec8bf9eda611b50e88e222404f7f1800758d293aa6b9bf42eae417b7ecdd72e4d2b3729348f99deee1653740a115053d101dc40cf7866f39a89932e5b88f38a3e18201a82d55c5838464a9a925645b3bbbec0a824152cd6f4a889711d000000c84d33ee7b69d005b3aa474142c479fdbc27ee03cf807a2c22da4266cc23b29d1075ffc780c78e2e4feac4d0d89ffbd1267ebce7177ea52dbdd17b3db5ee79efedbfa3c02e865bbb0cd039a20e3f3b17037419a9402f749b232596a3304461e77b63de1f7259088517afafcd6f08a89069f413e4dc72774a3b1609f0655367513a423179322be1c5df8803e92903d0575273f69a6bdfe53b768ea826a368d6be9b77af2e405f80d998c0ea8d494628b8b7587e7623ff1ba5f8df7e44a8d9b857bad9212753f152229caf5d4cca715c63ce645d708656aedee2b91caf2c0165e3420667098f8a1694ae6ab41344b3a04a61cf76f988577d7d9c2854ccd7224d5726846476fd5fc54a5d43385167c95144f2643f533cc85bb9d16b782f8d7db193506d86582d252405b840018792cad2bf1259f1ef5aa5f887e13cb2f0094f51e1ffff0ad7e659772f9534c195c815efc4014ef1e1daed4404c06385d11192e92b6cf04127db05441cd833107a52be852868890e4317e6a02ab47683aa75964220b7d05f875f140027ef5118a2247bbb84ce8f2f0f1123623085daf7960c329f5fdf6af5f5bbdb6be9ef8aa618e4bf8073960867171e29676f8b284dea6a08a85eb58d900f5e182e3c50ef74969ea16c7726c549757cc23523c369587da7293784d49a7502ffcfb0340b1d7885688500ca308161a7f96b62df9d083b71fcc8f2bb8fe6b1689256c0d385f42f5bbe2027a22c1996e110ba97c171d3e5948de92beb8d0d63c39ebade8509e0ae3c9c3876fb5fa112be18f905ecacfecb92057603ab95eec8b2e541cad4e91de38385f2e046619f54496c2382cb6cacd5b98c26f5a4f893e908917775b62bff23294dbbe3a1cd8e6cc1c35b4801887b646a6f81f17f96000000000000000000000000000000000000000000000000000000000000005c3de5205610ee0093be1f5c603ddc1b935b396000c16eb8b12d75b7048cfe9ff5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b25de65943203f1ef82f8a1a2786f512445a9bb3311624444d6dfa52c543c95c342e5321a7259f553a7364549d37d176d742f4737ab627bf02d939f04a81a78a6efc8b1f6723824e7f3330f336ae040d949f2c8eb639cff8f8e42cb011e1657edf5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4bdb56114e00fdd4c1f85c892bf35ac9a89289aaecb1ebd0a96cde606a748b5d71cfdb92aef2effd1afd6666d196fe0eb551a1c9f66af41578dcd6e6e293edc18a0906000010000000480100009f01000034010000f90131a01fdacd1aa096a132805e9ce5cd2c6d32e98d370fc58e5431a29d2d956a7ae100a057f1128a1144f74500ed555f4ce7580489e3249f18761e99390fa9ae03adb1d3a0caa4dc07ecf44eb53c31df33bc62473b3623b8794a97db9432695da98f18ffa2a0d4ef4c34bfcab8e6d527994ac729d476be7b374078f32f29d10087f843c3f76da0ef78f113f506ae8ce8344436cc8175759fa9f0a0d92a58781ddabd61699326eba019da14e7dcd4cf3ae8126fc398a773bc673f90a4c93f917cd7dcee5eb8bbe631a04de90abb9dcf5c3b0ec40a74702b2f31f7d5ac00b773e582ad1d30511e6e49afa0a8335eb14726a17eac4056ef94d87690a305410f957fe27cf818cd90ef8be0dfa0a02a9d0cb3d8ed6dc2c30d2fe15b4b0429ac9f5b907c48a0272f0b1768d34e2e808080808080808053000000f851a044410dfe531c9695fdd876bc6ca75777a7623670d414229d6b56299611bc4444a0a5e5fbd1fa7ab725ed89581d4aa4b4433bfc8a11f08e22c8d36bca251e2bbc7980808080808080808080808080808066040000f9046320b9045f02f9045b018301cb09b9010000200000000000000080000080000000000000000000000000000000000000000004000000000000008000000000800000000000000400000000000000200000000000000000000008000008000000200000000000000000000000000000040000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000018000080000004000000000020000000000200000000000000000000001000000000000000801000000000000000002000000000000000000000000000000000400001000000000000000040010000020000000000000000000000000000000008000000000000000000000f90350f89b940f2d719407fdbeff09d87557abb7232601fd9f29f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa000000000000000000000000020c4006f6d734a3b5a8699fb8efbc9221a4617d1a000000000000000000000000005104ebba2b6d3b8254aa41cf6df80462f6160aea00000000000000000000000000000000000000000000001bc0638761ee4b3485af89b940f2d719407fdbeff09d87557abb7232601fd9f29f863a08c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925a000000000000000000000000020c4006f6d734a3b5a8699fb8efbc9221a4617d1a0000000000000000000000000d9e1ce17f2641f24ae83637ab66a2cca9c378b9fa0fffffffffffffffffffffffffffffffffffffffffffffa70296bbe2cfcb79a98f89b94a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa000000000000000000000000005104ebba2b6d3b8254aa41cf6df80462f6160aea000000000000000000000000020c4006f6d734a3b5a8699fb8efbc9221a4617d1a00000000000000000000000000000000000000000000000000000000279500bccf8799405104ebba2b6d3b8254aa41cf6df80462f6160aee1a01c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1b84000000000000000000000000000000000000000000000b4648e21e1993b6b5f83000000000000000000000000000000000000000000000000000000ff9663d092f8fc9405104ebba2b6d3b8254aa41cf6df80462f6160aef863a0d78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822a0000000000000000000000000d9e1ce17f2641f24ae83637ab66a2cca9c378b9fa000000000000000000000000020c4006f6d734a3b5a8699fb8efbc9221a4617d1b8800000000000000000000000000000000000000000000001bc0638761ee4b3485a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000279500bcc08000000b63ca7d255914c8c6f796387c637c7d1d8bed538369982bf7bbb3d91bc27ebd1a08cb14da5b16b0c18751dfe95f8dc3316571510b283c1e38ad39266bd5f699155a71343e96977171fc6be6f0dd9648aee8229313385b378e155dcbeffad8a38499e576f2ab182a1e766ca7fc6563d8b8f15cb83bee30e5fc6cc6dfbc496bef3efc8b1f6723824e7f3330f336ae040d949f2c8eb639cff8f8e42cb011e1657edf5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4bdb56114e00fdd4c1f85c892bf35ac9a89289aaecb1ebd0a96cde606a748b5d71cfdb92aef2effd1afd6666d196fe0eb551a1c9f66af41578dcd6e6e293edc18ae9050000e90500000c000000860100007601000002f90172011b841dcd6500850b1dffcc468302575e94d9e1ce17f2641f24ae83637ab66a2cca9c378b9f80b9010438ed17390000000000000000000000000000000000000000000001bc0638761ee4b3485a000000000000000000000000000000000000000000000000000000027629705a00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000020c4006f6d734a3b5a8699fb8efbc9221a4617d10000000000000000000000000000000000000000000000000000000063ffb72f00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000f2d719407fdbeff09d87557abb7232601fd9f29000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48c001a0e6c22713ee4e319ccf1a9a10da83506083fe4285e2c1d2fd9c3aa60b2e9e5deaa02ccb1096a72f2605d81e4e649a36ed5a33fad3cd192427df9e58ecffc49bd1785f04000002f9045b018301cb09b9010000200000000000000080000080000000000000000000000000000000000000000004000000000000008000000000800000000000000400000000000000200000000000000000000008000008000000200000000000000000000000000000040000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000018000080000004000000000020000000000200000000000000000000001000000000000000801000000000000000002000000000000000000000000000000000400001000000000000000040010000020000000000000000000000000000000008000000000000000000000f90350f89b940f2d719407fdbeff09d87557abb7232601fd9f29f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa000000000000000000000000020c4006f6d734a3b5a8699fb8efbc9221a4617d1a000000000000000000000000005104ebba2b6d3b8254aa41cf6df80462f6160aea00000000000000000000000000000000000000000000001bc0638761ee4b3485af89b940f2d719407fdbeff09d87557abb7232601fd9f29f863a08c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925a000000000000000000000000020c4006f6d734a3b5a8699fb8efbc9221a4617d1a0000000000000000000000000d9e1ce17f2641f24ae83637ab66a2cca9c378b9fa0fffffffffffffffffffffffffffffffffffffffffffffa70296bbe2cfcb79a98f89b94a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa000000000000000000000000005104ebba2b6d3b8254aa41cf6df80462f6160aea000000000000000000000000020c4006f6d734a3b5a8699fb8efbc9221a4617d1a00000000000000000000000000000000000000000000000000000000279500bccf8799405104ebba2b6d3b8254aa41cf6df80462f6160aee1a01c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1b84000000000000000000000000000000000000000000000b4648e21e1993b6b5f83000000000000000000000000000000000000000000000000000000ff9663d092f8fc9405104ebba2b6d3b8254aa41cf6df80462f6160aef863a0d78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822a0000000000000000000000000d9e1ce17f2641f24ae83637ab66a2cca9c378b9fa000000000000000000000000020c4006f6d734a3b5a8699fb8efbc9221a4617d1b8800000000000000000000000000000000000000000000001bc0638761ee4b3485a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000279500bcc"]}`
        const proofTxMap = JSON.parse(proofTx)
        let txSkeleton = helpers.TransactionSkeleton({});
        console.log("proofTxMap[\"witnesses\"]:", proofTxMap["witnesses"])
        txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => cellDeps.push(...proofTxMap["cell_deps"].map(dep => toCellDep(dep))))

        txSkeleton = txSkeleton.update("witnesses", (wits) => wits.push(...proofTxMap["witnesses"]))

        const account = generateAccountFromPrivateKey(account1_private)

        const response = await RPCClient.getTransaction("0x8e842c7a5a3e1ebb09605c8aebff48507e06814e36ddccd1ef06c7b3f414d875")

        const tx = await buildTransactionWithTxType(txSkeleton, {
            ckbUrl: CKB_RPC_URL,
            from: account.address,
            inputCells: [
                // {
                {
                    data: "0x",
                    cellOutput: {
                        capacity: response.transaction.outputs[1].capacity,
                        lock: response.transaction.outputs[1].lock,
                        type: response.transaction.outputs[1].type
                    },
                    outPoint: {
                        txHash: "0x8e842c7a5a3e1ebb09605c8aebff48507e06814e36ddccd1ef06c7b3f414d875",
                        index: "0x1",
                    }
                },
                // }
            ],
            deps: [EthLightClientBusinessContract.getDepsCell()],
            outputCells: [getLockCell({
                address: account.address, amount: "70"
            })]

        })
        const sendTx = signTransaction(tx, account1_private)
        console.log("sendTx:", JSON.stringify(sendTx))
        const hash = await RPCClient.sendTransaction(sendTx, "passthrough")
        console.log(hash)

    })

    it.skip("decode witnessArgs", async () => {
        blockchain.WitnessArgs.unpack("0x0")
    })
});







