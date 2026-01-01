
module.exports = async (axios) => {
    let sec = {}
    const securityMethodsData = await axios.get(`https://account.live.com/proofs/manage/additional`)
    let secMatch = securityMethodsData?.data?.match(/var\s+t0\s*=\s*({[^;]+})/)?.[1]
    if (secMatch) {
        let obj = JSON.parse(secMatch)
        let data = obj?.WLXAccount?.manageProofs
        sec.netId = data?.encryptedNetId
        sec.emails = data?.emailProofs
        sec.authApp = data?.msAuthApp
        sec.phoneNumbers = data?.smsProofs
        return sec
    }
    return false
}