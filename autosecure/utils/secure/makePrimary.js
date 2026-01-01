const HttpClient = require("../process/HttpClient");

module.exports = async (cookiedata, alias, apicanary, amsc, retryCount = 0) => {
    let axios = new HttpClient();
    let amrp = cookiedata.cookies.amrp;
    let setPrimaryStatus = { success: false, message: "nothing" };
    let data;
    const maxRetries = 2;

    try {
        console.log(`[MAKEPRIMARY] Attempting to set ${alias} as primary (attempt ${retryCount + 1}/${maxRetries + 1})`);
        data = await axios.post(
            "https://account.live.com/API/MakePrimary",
            {
                aliasName: alias,
                emailChecked: true,
                removeOldPrimary: false
            },
            {
                headers: {
                    Cookie: `AMRPSSecAuth=${amrp}; amsc=${amsc}`,
                    canary: apicanary
                }
            }
        );
    } catch (error) {
        console.log(`[MAKEPRIMARY] Network error: ${error.message}`);
        if (retryCount < maxRetries && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message.includes('timeout'))) {
            console.log(`[MAKEPRIMARY] Retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return await module.exports(cookiedata, alias, apicanary, amsc, retryCount + 1);
        }
        setPrimaryStatus.message = `Got Error ${error.message} while trying to set alias as primary`;
        setPrimaryStatus.success = false;
        console.log(setPrimaryStatus.message);
        return setPrimaryStatus.success;
    }

    console.log("makePrimary data:", data?.data);

    if (data?.data?.apiCanary) {
        setPrimaryStatus.message = `Set Alias ${alias} as your primary alias`;
        setPrimaryStatus.success = true;
        console.log(setPrimaryStatus.message);
        return setPrimaryStatus.success;
    }

    const errorCode = data?.data?.error?.code;
    if (errorCode === "1282") {
        setPrimaryStatus.message = "Rate limited from setting primary aliases";
    } else if (errorCode === "1178") {
        setPrimaryStatus.message = "Microsoft rejected the request, please try again later";
    } else if (errorCode === "500" && data?.data?.error?.telemetryContext) {
        // For 500 errors, try once more before assuming success
        if (retryCount < maxRetries) {
            console.log(`[MAKEPRIMARY] Got 500 error, retrying in 3 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return await module.exports(cookiedata, alias, apicanary, amsc, retryCount + 1);
        }
        setPrimaryStatus.message = "Got error 500 (Services down), assuming primary is set!";
        setPrimaryStatus.success = true;
        console.log(setPrimaryStatus.message);
        return setPrimaryStatus.success;
    } else if (data?.data?.error?.telemetryContext) {
        setPrimaryStatus.message = "Microsoft rejected the request, please try again later";
    } else {
        setPrimaryStatus.message = "Failed to set the alias as primary, due to an unknown error";
    }

    setPrimaryStatus.success = false;
    console.log(setPrimaryStatus.message);
    return setPrimaryStatus.success;
};
