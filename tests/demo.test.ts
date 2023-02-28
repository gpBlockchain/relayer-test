import {step} from "./utils/util";
import {sh} from "../src/utils/sh";

describe('demo', function () {

    it("dd", async () => {
        await step("demo 1", async () => {
            console.log("run demo 1")
            await sh("pwd")
        })
    })
});
