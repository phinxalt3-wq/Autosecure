const decode = require("./decode");
const axios = require('axios'); 

module.exports = async (axiosInstance, netId, canary, obj) => {

    console.log(`Amrp: ${obj.amrp} & amsc: ${obj.amsc}`)
    let apicanary = null;
    if (!canary) {
        apicanary = axiosInstance.getCookie("canary");
    } else {
        apicanary = canary;
    }

    const clientheaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
        'Accept': 'application/json',
        'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Referer': 'https://account.live.com/proofs/manage/additional/',
        'Content-Type': 'application/json',
        'x-ms-apiVersion': '2',
        'x-ms-apiTransport': 'xhr',
        'uiflvr': '1001',
        'scid': '100109',
        'hpgid': '201030',
        'uaid': 'b4c163d6621c4b18be6ce7780ddd1901',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://account.live.com',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'canary': decode(apicanary || "")
    };

    const payload = {
        encryptedNetId: netId
    };

    const { data } = await axiosInstance.post(
        'https://account.live.com/API/Proofs/GenerateRecoveryCode',
        payload,
        { headers: clientheaders }
    );

    if (data?.recoveryCode) {
        return data.recoveryCode;
    }

    console.log(`Trying 2nd method for recovery!`)

    const clientheadersWithCookie = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
        'Accept': 'application/json',
        'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Referer': 'https://account.live.com/proofs/manage/additional/',
        'Content-Type': 'application/json',
        'x-ms-apiVersion': '2',
        'x-ms-apiTransport': 'xhr',
        'uiflvr': '1001',
        'scid': '100109',
        'hpgid': '201030',
        'uaid': 'b4c163d6621c4b18be6ce7780ddd1901',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://account.live.com',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'canary': decode(apicanary || ""),
        'cookie': `amsc=${obj.amsc}; AMRPSSecAuth=${obj.amrp};`
    };

    // Using normal axios here instead of the custom instance
    const { data: data2 } = await axios.post(
        'https://account.live.com/API/Proofs/GenerateRecoveryCode',
        payload,
        { headers: clientheadersWithCookie }
    );

    if (data2?.recoveryCode) {
        console.log(`Got recovery with second method!`)
        return data2.recoveryCode;
    }

    let test = JSON.stringify(data2);
    console.log(`recovery weird issue: ${test}`);
    return false;
};