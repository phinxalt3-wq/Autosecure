const Encrypt = require("../../../msa/encryptOtt2")
const HttpClient = require("../../../process/httpClient")
/**
 * 
 * @param {string} email 
 * @param {string} recoveryCode 
 * @param {{securityEmail,password}} outputs 
 * @returns 
 */
module.exports = async (email, recoveryCode, outputs) => {
    let secureResult = { success: false, message: "couldn't secure" }
    let axios = new HttpClient()
    try {
        const data = await axios.get(`https://account.live.com/ResetPassword.aspx?wreply=https://login.live.com/oauth20_authorize.srf&mn=${email}`)
        if (data.data.includes("reset-password-signinname_en")) {
            secureResult.message = "Couldn't find your email"
            return secureResult
        }


        serverData = null

        const match = data?.data?.match(/var\s+ServerData=(.*?)(?=;|$)/)?.[1];

        if (match) {
            serverData = JSON.parse(match);
        } else {
            secureResult.message = "Failed to get server data!"
            return secureResult
        }

        let encrypted = Encrypt(null, recoveryCode, `saproof`, null)
        let recToken = await axios.post(`https://account.live.com/API/Recovery/VerifyRecoveryCode`,
            {
                code: recoveryCode,
                encryptedCode: encrypted,
                publicKey: "08D47C476EFCAE0410F357E362C347FCA50F65EA",
                recoveryCode: recoveryCode,
                token: decodeURIComponent(serverData?.sRecoveryToken),
            },
            {
                headers: {
                    Canary: serverData?.apiCanary
                }
            })
        if (recToken?.data?.token) {
            const useToken = await axios.post(`https://account.live.com/API/Recovery/RecoverUser`, {
                "contactEmail": outputs.securityEmail,
                "contactEpid": "",
                "password": outputs.password,
                "passwordExpiryEnabled": 0,
                "publicKey": "2CBB3761027476727BDDBC9DE02870BE01ED793A",
                "token": decodeURIComponent(recToken?.data?.token),
            }, {
                headers: {
                    Canary: serverData?.apiCanary,
                }
            })
            if (useToken?.data?.error?.code == "1218") {
                secureResult.message = "Make sure the password isn't the same as your current account's password!"
                return secureResult
            } else if (!useToken?.data?.recoveryCode) {
                secureResult.message = "Failed while trying to secure!"
                return secureResult
            }
            secureResult.recoveryCode = useToken?.data?.recoveryCode
            secureResult.success = true
            return secureResult
        } else {
            secureResult.success = false
            secureResult.error = "Failed to get token, is the Recovery Code Correct?"
            return secureResult
        }
    } catch (e) {
        console.log(e)
        secureResult.message = e.message
        return secureResult
    }
}