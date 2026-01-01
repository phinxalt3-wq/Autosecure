const getLiveData = require("./getLiveData");
const axios = require('axios'); 

async function loginpass(email, pass) {
    try {
        let data = await getLiveData();

        let loginpassword = await axios({
            method: "POST",
            url: "https://login.live.com/ppsecure/post.srf",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Cookie: data.cookies,
            },
            data: `ps=2&psRNGCDefaultType=&psRNGCEntropy=&psRNGCSLK=&canary=&ctx=&hpgrequestid=&PPFT=${data.ppft}&PPSX=PassportRN&NewUser=1&FoundMSAs=&fspost=0&i21=0&CookieDisclosure=0&IsFidoSupported=1&isSignupPost=0&isRecoveryAttemptPost=0&i13=0&login=${email}&loginfmt=${email}&type=11&LoginOptions=3&lrt=&lrtPartition=&hisRegion=&hisScaleUnit=&passwd=${pass}`,
        });

        if (loginpassword.status < 200 || loginpassword.status >= 400) {
            return null
        }

        let passwordhost = null;
        loginpassword.headers["set-cookie"].forEach((cookie) => {
            const [name, ...values] = cookie.split("=");
            if (name === "__Host-MSAAUTH") {
                passwordhost = values.join("=").split(";").shift();
            } else{
                return null
            }
        });

        return passwordhost;

    } catch (error) {
        console.error("Error during login:", error);
        return null;
    }
}

module.exports = loginpass;
