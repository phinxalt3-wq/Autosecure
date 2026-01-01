const { chromium } = require("playwright");
const generateotp = require("../codefromsecret");

const DEFAULT_BROWSER_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--disable-dev-shm-usage",
    "--disable-web-security",
    "--no-sandbox"
];

const DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

async function fillAndSubmit(page, selector, value) {
    await page.waitForSelector(selector, { timeout: 45000, state: "visible" });
    await page.fill(selector, value, { timeout: 20000 });
    await page.waitForTimeout(150);
}

async function performLogin(page, email, password, secretKey) {
    await page.goto("https://login.live.com/", {
        waitUntil: "domcontentloaded",
        timeout: 45000
    });

    await fillAndSubmit(page, 'input[name="loginfmt"]', email);
    await page.click("#idSIButton9", { timeout: 20000 }).catch(async () => {
        await page.press('input[name="loginfmt"]', "Enter").catch(() => {});
    });

    await fillAndSubmit(page, 'input[name="passwd"]', password);
    await page.click("#idSIButton9", { timeout: 20000 }).catch(async () => {
        await page.press('input[name="passwd"]', "Enter").catch(() => {});
    });

    const otpInputSelectors = [
        'input[name="otc"]',
        '#idTxtBx_SAOTCC_OTC',
        '[inputmode="numeric"]',
        'input[name="otc"]'
    ];
    let otpInput = null;
    for (const selector of otpInputSelectors) {
        try {
            otpInput = await page.waitForSelector(selector, { timeout: 20000 });
            if (otpInput) break;
        } catch {
            continue;
        }
    }
    if (!otpInput) {
        throw new Error("OTP_INPUT_NOT_FOUND");
    }

    const totp = await generateotp(secretKey);
    if (!totp?.otp) {
        throw new Error("INVALID_SECRET");
    }

    await otpInput.fill(totp.otp);

    const submitSelectors = ["#idSubmit_SAOTCC_Continue", "#idSIButton9", 'button[type="submit"]'];
    let submitted = false;
    for (const selector of submitSelectors) {
        try {
            await page.click(selector, { timeout: 10000 });
            submitted = true;
            break;
        } catch {
            continue;
        }
    }
    if (!submitted) {
        await page.keyboard.press("Enter").catch(() => {});
    }

    // Stay signed in prompt
    await page.waitForTimeout(500);
    await page.click("#idSIButton9", { timeout: 5000 }).catch(() => {});

    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});

    const cookies = await page.context().cookies("https://login.live.com");
    const msauthCookie = cookies.find(cookie => cookie.name === "__Host-MSAAUTH");

    if (!msauthCookie) {
        throw new Error("MSAUTH_MISSING");
    }

    return msauthCookie.value;
}

module.exports = async function browserZygerLogin({ email, password, secretKey }, options = {}) {
    if (!email || !password || !secretKey) {
        throw new Error("browserZygerLogin requires email, password and secretKey");
    }

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
        const host = await performLogin(page, email, password, secretKey);
        return {
            status: "success",
            host
        };
    } catch (error) {
        return { status: "error", error: error.message || "BROWSER_LOGIN_FAILED" };
    } finally {
        await context.close().catch(() => {});
        await browser.close().catch(() => {});
    }
};


