import { connect } from 'puppeteer-real-browser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load credentials from config.json using a relative path
const configPath = path.join(__dirname, '../../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const hypixelemail = config.hypixelemail;
const hypixelpassword = config.hypixelpassword;

export async function api() {
    const realBrowserOption = {
        args: ["--start-maximized"],
        turnstile: true,
        headless: false,
        connectOption: {
            defaultViewport: null,
            userDataDir: './hypixel_session'  // Persist cookies
        }
    };
    
    const { page, browser } = await connect(realBrowserOption);
    let sigma = false; // If passed first captcha
    let expirationTime = null;  
    let apiKey = null;
    let sendRequestAfterClick = false;  // Flag to control when the specific request is sent

    // Function to capture requests
    const captureRequest = (request) => {
        // Removed console.log for every request
    };

    // Function to capture responses
    const captureResponse = async (response) => {
        const url = response.url();
        if (sendRequestAfterClick && url === 'https://dev-api.hypixel.net/key/developer' && response.status() === 200) {
            const responseBody = await response.json();
            if (responseBody?.error === "Too many requests") {
                console.log('Too many requests');
                return null;
            }
            apiKey = responseBody.key.key; // Extract the key from the response
            expirationTime = responseBody.key.expiration;
        }
    };

    try {
        await page.goto('https://hypixel.net/login/', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Cloudfare
        
        await page.type('input[name="login"]', hypixelemail, { delay: 300 });
        await page.type('input[name="password"]', hypixelpassword, { delay: 300 });
        await page.click('.button--icon--login');
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        page.on('request', captureRequest);
        page.on('response', captureResponse);
        
        await page.goto('https://developer.hypixel.net/dashboard', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        sigma = true;
        await page.click('button.v-btn:nth-child(1)');
        await new Promise(resolve => setTimeout(resolve, 6000));
        await new Promise(resolve => setTimeout(resolve, 5000));  
        
        sendRequestAfterClick = true;
        await page.click('.text-warning');
        await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error) {
        console.error('Automation Error:', error);
        if (sigma) {
            console.log('Passed first captcha then failed!');
            return null;
        }
        return null;
    } finally {
        await browser.close();
    }
    
    return { apiKey, expirationTime };
}