import {RPC_DEBUG_SERVICE} from "../config/config";
import fetch from "cross-fetch";

export const request = async (
    id: number,
    ckbIndexerUrl: string,
    method: string,
    params?: any
): Promise<any> => {
    if (RPC_DEBUG_SERVICE) {
        console.log("curl --location --request POST '" + ckbIndexerUrl + "' \\\n" +
            "--header 'Content-Type: application/json' \\\n" +
            "--data-raw '{\n" +
            "\t\"jsonrpc\":\"2.0\",\n" +
            "\t\"method\":\"" + method + "\",\n" +
            "\t\"params\":" + JSON.stringify(params) + ",\n" +
            "\t\"id\":64\n" +
            "}'")
    }
    const res = await fetch(ckbIndexerUrl, {
        method: "POST",
        body: JSON.stringify({
            id,
            jsonrpc: "2.0",
            method,
            params
        }),
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (res.status !== 200) {
        throw new Error(`light client request failed with HTTP code ${res.status}`);
    }
    const data = await res.json();

    if (data.error !== undefined) {
        if (RPC_DEBUG_SERVICE) {
            console.log( JSON.stringify(data.error))
        }
        throw new Error(
            `light client request rpc failed with error: ${JSON.stringify(
                data.error
            )}`
        );
    }
    if (RPC_DEBUG_SERVICE) {
        console.log( JSON.stringify(data.result))
    }
    return data.result;
};
export async function Sleep(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}

export async function getJsonData(url: string): Promise<any> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const jsonData = await response.json();
        return jsonData;
    } catch (error) {
        throw new Error(`Error fetching JSON data: ${error.message}`);
    }
}