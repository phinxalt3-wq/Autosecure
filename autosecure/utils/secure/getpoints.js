async function getpoints(axios) {
    let response = await axios.get(`https://account.microsoft.com/home/api/rewards/rewards-summary?lang=en-US&refd=account.live.com&refp=landing&mkt=EN-US&status=cancelled&res=acw_landing_page_cancelled`, {
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        },
    })
    return response.data.balance;
}

module.exports = getpoints;
