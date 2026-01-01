const { chromium } = require("playwright");
const encryptOtt2 = require("../encryptOtt2");

const RESET_URL = "https://account.live.com/ResetPassword.aspx?wreply=https://login.live.com/oauth20_authorize.srf&mn=";
const VERIFY_URL = "https://account.live.com/API/Recovery/VerifyRecoveryCode";
const RECOVER_URL = "https://account.live.com/API/Recovery/RecoverUser";
const VERIFY_PUBLIC_KEY = "08D47C476EFCAE0410F357E362C347FCA50F65EA";
const RECOVER_PUBLIC_KEY = "2CBB3761027476727BDDBC9DE02870BE01ED793A";

const DEFAULT_BROWSER_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--disable-dev-shm-usage",
    "--disable-web-security",
    "--no-sandbox"
];

const DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

function normalizeRecoveryCode(code) {
    if (!code || typeof code !== "string") return null;
    const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalized.length !== 25) return null;
    return normalized.match(/.{1,5}/g).join("-");
}

async function runInBrowser(email, payload, options = {}) {
    const browser = await chromium.launch({
        headless: options.headless ?? true,
        args: [...DEFAULT_BROWSER_ARGS, ...(options.browserArgs || [])]
    });

    const context = await browser.newContext({
        viewport: options.viewport || { width: 1280, height: 720 },
        userAgent: options.userAgent || DEFAULT_UA
    });

    const page = await context.newPage();

    try {
        const targetUrl = `${RESET_URL}${encodeURIComponent(email)}`;
        await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: options.timeout || 45000 });
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

        const recoveryResult = await page.evaluate(async (params) => {
            const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            const decodeToken = (value) => {
                try {
                    return decodeURIComponent(value);
                } catch {
                    return value;
                }
            };

            if (typeof window === "undefined") {
                return { status: "error", error: "NO_WINDOW" };
            }

            let serverData = window.ServerData || null;
            if (!serverData) {
                await sleep(1000);
                serverData = window.ServerData || null;
            }

            if (!serverData || !serverData.apiCanary || !serverData.sRecoveryToken) {
                return { status: "error", error: "NO_SERVERDATA" };
            }

            const telemetryContext = serverData.telemetryContext || window.telemetryContext || null;

            const baseHeaders = {
                "Content-Type": "application/json; charset=utf-8",
                "Canary": serverData.apiCanary,
                "canary": serverData.apiCanary
            };

            if (telemetryContext) {
                baseHeaders["TelemetryContext"] = telemetryContext;
                baseHeaders["telemetrycontext"] = telemetryContext;
            }

            try {
                const verifyResponse = await fetch(params.verifyUrl, {
                    method: "POST",
                    credentials: "include",
                    headers: baseHeaders,
                    body: JSON.stringify({
                        publicKey: params.verifyPublicKey,
                        recoveryCode: params.normalizedCode,
                        code: params.normalizedCode,
                        encryptedCode: params.encryptedCode,
                        scid: 100103,
                        telemetryContext,
                        token: decodeToken(serverData.sRecoveryToken),
                        uiflvr: 1001
                    })
                });

                const verifyJson = await verifyResponse.json();
                if (!verifyJson?.token) {
                    return {
                        status: "error",
                        stage: "verify",
                        error: verifyJson?.error?.code || "VERIFY_FAILED",
                        details: verifyJson
                    };
                }

                const verificationToken = decodeToken(verifyJson.token);
                const recoverResponse = await fetch(params.recoverUrl, {
                    method: "POST",
                    credentials: "include",
                    headers: baseHeaders,
                    body: JSON.stringify({
                        contactEmail: params.secEmail,
                        contactEpid: "",
                        password: params.password,
                        passwordExpiryEnabled: 0,
                        publicKey: params.recoverPublicKey,
                        token: verificationToken,
                        telemetryContext
                    })
                });

                const recoverJson = await recoverResponse.json();

                if (recoverJson?.error) {
                    return {
                        status: "error",
                        stage: "recover",
                        error: recoverJson.error.code || "RECOVER_FAILED",
                        details: recoverJson
                    };
                }

                if (!recoverJson?.recoveryCode) {
                    return {
                        status: "error",
                        stage: "recover",
                        error: "NO_RECOVERY_CODE",
                        details: recoverJson
                    };
                }

                return {
                    status: "success",
                    payload: {
                        email2: params.email,
                        recoveryCode: recoverJson.recoveryCode,
                        secEmail: params.secEmail,
                        password: params.password
                    }
                };
            } catch (err) {
                return { status: "error", error: err.message || "BROWSER_FLOW_FAILED" };
            }
        }, payload);

        return recoveryResult;
    } finally {
        await context.close().catch(() => {});
        await browser.close().catch(() => {});
    }
}

module.exports = async function browserRecovery(email, recoveryCode, secEmail, password, options = {}) {
    const normalizedCode = normalizeRecoveryCode(recoveryCode);
    if (!normalizedCode) {
        return { status: "invalid", error: "INVALID_RECOVERY_FORMAT" };
    }

    const encryptedCode = encryptOtt2(null, normalizedCode, "saproof", null);
    if (!encryptedCode) {
        return { status: "invalid", error: "ENCRYPTION_FAILED" };
    }

    return runInBrowser(
        email,
        {
            email,
            normalizedCode,
            encryptedCode,
            secEmail,
            password,
            verifyUrl: VERIFY_URL,
            recoverUrl: RECOVER_URL,
            verifyPublicKey: VERIFY_PUBLIC_KEY,
            recoverPublicKey: RECOVER_PUBLIC_KEY
        },
        options
    );
};

