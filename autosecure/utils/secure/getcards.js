async function getcards(msatoken, axios) {
    try {
        const response = await axios.get('https://paymentinstruments.mp.microsoft.com/v6.0/users/me/paymentInstrumentsEx?status=active,removed&language=nl-NL&partner=northstarweb', {
            params: {
                'lang': 'en-GB'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
                'Accept': 'application/json',
                'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Referer': 'https://account.microsoft.com/',
                'Content-Type': 'application/json',
                'Authorization': msatoken,
                'x-ms-test': 'undefined',
                'Origin': 'https://account.microsoft.com',
                'DNT': '1',
                'Sec-GPC': '1',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'Priority': 'u=4',
                'TE': 'trailers'
            },
            maxRedirects: 0 
        });


    //    console.log(`card data: ${JSON.stringify(response.data)}`)


        let totalBalance = 0;
        if (response.data && Array.isArray(response.data)) {
            response.data.forEach(card => {
                if (card.details && card.details.balance !== undefined && card.details.balance !== null) {
                    totalBalance += parseFloat(card.details.balance);
                }
            });
        }

        return {
            data: JSON.stringify(response.data),
            totalBalance: parseFloat(totalBalance)
        };

    } catch (error) {
        console.error('Error fetching cards:', error);
        return {
            data: null,
            totalBalance: 0,
            error: error.message
        };
    }
}

module.exports = getcards;