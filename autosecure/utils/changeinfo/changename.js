const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const FormData = require("form-data");
const { captchaImageToBase64, submitCaptchaTo2Captcha, getCaptchaResult } = require("../process/helpers");

module.exports = async function changename(axios, name) {
    try {
        const challengeResponse = await axios.get('https://account.microsoft.com/api/hip/challenge/visual', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'X-Requested-With': 'XMLHttpRequest',
                'Correlation-Context': 'v=1,ms.b.tel.market=nl-NL,ms.b.qos.rootOperationName=GLOBAL.HIP.GETCHALLENGE.VISUAL,ms.b.tel.scenario=ust.amc.profile.editname,ms.c.ust.scenarioStep=OpenEditor',
                'Connection': 'keep-alive',
                'Referer': 'https://account.microsoft.com/profile/edit-name',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            }
        });

        const challengeData = challengeResponse?.data;
        const challengeId = challengeData?.context?.challengeId;
        const base64Token = challengeData?.challengeSource;
        const region = challengeData?.context?.azureRegion;
        const type = challengeData?.context?.challengeType;

        if (!challengeId || !base64Token || !region || !type) {
            console.error("[-] Failed to extract CAPTCHA challenge information.");
            return false;
        }

        const base64 = captchaImageToBase64(base64Token);
        const requestId = await submitCaptchaTo2Captcha(base64);
        const captchasolution = await getCaptchaResult(requestId);

        if (!captchasolution) {
            console.error("[-] CAPTCHA solution failed.");
            return false;
        }

        console.log(`Captcha solution: ${captchasolution}`)

        const [newfirst, newlast] = name.split("|");

        const namedata = {
            firstName: newfirst,
            lastName: newlast,
            hipSolution: captchasolution,
            hipContext: {
                challengeType: type,
                azureRegion: region,
                challengeId: challengeId
            }
        };

        const validated = await axios.put("https://account.microsoft.com/profile/api/v1/edit-name/name", namedata, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0',
                'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'X-Requested-With': 'XMLHttpRequest',
                'Correlation-Context': 'v=1,ms.b.tel.market=nl-NL,ms.b.qos.rootOperationName=GLOBAL.PROFILE.EDITNAMEAPI.EDITNAME,ms.b.tel.scenario=ust.amc.profile.editname,ms.c.ust.scenarioStep=Saving',
                'Origin': 'https://account.microsoft.com',
                'Connection': 'keep-alive',
                'Referer': 'https://account.microsoft.com/profile/edit-name',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'Priority': 'u=0'
            }
        });

        if (validated.status === 200){
            console.log(`Changed name :)`)
        } else{
            console.log(`Failed to change name :(`)    
        }
        return validated.status === 200;
    } catch (err) {
        console.error("[-] Error changing name:", err.message);
        return false;
    }
}
