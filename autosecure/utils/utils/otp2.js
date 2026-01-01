const axios = require('axios')

module.exports = async function otpmethod2(email) {
    await sendRequest(email)
    return true
}

async function sendRequest(email) {
    const { data } = await axios({
        method: "POST",
        url: "https://login.live.com/GetCredentialType.srf",
        timeout: 3000, // 3 second timeout for faster response
        headers: {
            Cookie: `MSPOK=$uuid-899fc7db-4aba-4e53-b33b-7b3268c26691`,
            'Content-Type': 'application/json'
        },
        data: {
            checkPhones: false, // Reduced to false for faster response
            country: "",
            federationFlags: 3,
            flowToken: "-DgAlkPotvHRxxasQViSq!n6!RCUSpfUm9bdVClpM6KR98HGq7plohQHfFANfGn4P7PN2GnUuAtn6Nu3dwU!Tisic5PrgO7w8Rn*LCKKQhcTDUPMM2QJJdjr4QkcdUXmPnuK!JOqW7GdIx3*icazjg5ZaS8w1ily5GLFRwdvobIOBDZP11n4dWICmPafkNpj5fKAMg3!ZY2EhKB7pVJ8ir4A$",
            forceotclogin: true,
            isCookieBannerShown: false, // Reduced to false for faster response
            isExternalFederationDisallowed: true,
            isFederationDisabled: true,
            isFidoSupported: false, // Reduced to false for faster response
            isOtherIdpSupported: false, // Reduced to false for faster response
            isRemoteConnectSupported: false, // Reduced to false for faster response
            isRemoteNGCSupported: false, // Reduced to false for faster response
            isSignup: false, // Reduced to false for faster response
            otclogindisallowed: true,
            username: email
        }
    })
  //  console.log(JSON.stringify(data))
}
