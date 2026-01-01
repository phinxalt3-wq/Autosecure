
module.exports = async (axios, netId) => {
    const { data } = await axios.post(`https://account.live.com/API/Proofs/GenerateRecoveryCode`, { encryptedNetId: netId })
    if (data?.recoveryCode) {
        return data.recoveryCode
    }
    return false
}