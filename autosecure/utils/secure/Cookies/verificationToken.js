

/**
 * 
 * @param {HttpClient} axios 
 */
module.exports = async (axios) => {
    const verificationTokenData = await axios.get(`https://account.microsoft.com/billing/addresses`)
    let verificationToken = verificationTokenData?.data?.match(/<input\s+name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"/)?.[1]
    if (verificationToken) {
        axios.axios.defaults.headers.common["__RequestVerificationToken"] = verificationToken
        return true
    } else {
        return false
    }
}