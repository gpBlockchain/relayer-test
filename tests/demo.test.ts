import {checkLightCellExist, step} from "./utils/util";
import {sh} from "../src/utils/sh";

describe('demo', function () {

    this.timeout(1000_000)
    it("dd", async () => {
        const randomId = "1r";
        const ret = await checkLightCellExist(`ibc-ckb-${randomId}`, 10)
        console.log(ret)

    })

});
