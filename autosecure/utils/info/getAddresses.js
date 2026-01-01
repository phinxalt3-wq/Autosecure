module.exports = async function getAddresses(axios) {
    try {
        let alladdresses = [];

        const verificationTokenData = await axios.get("https://account.microsoft.com/billing/addresses");
        const verificationToken = verificationTokenData?.data?.match(/<input\s+name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"/)?.[1];

        if (!verificationToken) {
            console.log("Failed to get billing token!");
            return false;
        }

     //   console.log("Got billing token!");

        const addr = await axios.get("https://account.microsoft.com/billing/api/shipping/address-list", {
            headers: {
                '__RequestVerificationToken': verificationToken,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'MS-CV': '5FvyAKcoIEeUv6bL.11.89',
                'X-Requested-With': 'XMLHttpRequest',
                'Correlation-Context': 'v=1,ms.b.tel.market=nl-NL,ms.b.qos.rootOperationName=BILLING.GETADDRESSES',
                'Connection': 'keep-alive',
                'Referer': 'https://account.microsoft.com/billing/addresses',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            }
        });

        const addressarray = addr?.data?.addresses;
        if (addressarray && addressarray.length > 0) {
            for (const ad of addressarray) {
                alladdresses.push(ad.address);
            }
            return JSON.stringify(alladdresses);
        }

        return false;
    } catch (err) {
        return false;
    }
};
