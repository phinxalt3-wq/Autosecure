const axios = require("axios");
function isValidUrl(urlString) {
    try {
        new URL(urlString);
        return true;
    } catch (e) {
        return false;
    }
}

class HttpClient {
    constructor() {
        this.cookies = [];
        this.axios = axios.create({
            timeout: 10000,
            maxRedirects: 0,
            withCredentials: true,
            validateStatus: (status) => status >= 200 && status < 600,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
            },
        });

        // Interceptors for handling cookies
        this.axios.interceptors.request.use(config => {
            if (this.cookies.length > 0) {
                config.headers['Cookie'] = this.cookies.join("; ");
            }
            return config;
        });

        this.axios.interceptors.response.use(response => {
            const setCookieHeader = response.headers['set-cookie'];
            if (setCookieHeader) {
                setCookieHeader.forEach(cookie => this.setCookie(cookie));
            }
            return response;
        });
    }

    // Method to get a cookie by name
    getCookie(cName) {
        const cookie = this.cookies.find(cookie => cookie.startsWith(`${cName}=`));
        return cookie ? cookie.split(';')[0].split('=')[1] : null;
    }

    // Method to set a cookie
    setCookie(cookie) {
        const [cName] = cookie.split("=");
        const cookieIndex = this.cookies.findIndex(c => c.startsWith(`${cName}=`));
        if (cookieIndex !== -1) {
            this.cookies[cookieIndex] = cookie;
        } else {
            this.cookies.push(cookie);
        }
    }

    async get(url, config = {}, retries = 3) {
        if (!isValidUrl(url)) throw "Invalid URL"
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await this.axios.get(url, config);
                return response;
            } catch (error) {
                if (attempt === retries - 1) throw error;
            }
        }
    }

    async post(url, data, config = {}, retries = 3) {
        if (!isValidUrl(url)) throw "Invalid URL"
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await this.axios.post(url, data, config);
                return response;
            } catch (error) {
                if (attempt === retries - 1) throw error;
            }
        }
    }

    async put(url, data, config = {}, retries = 3) {
        if (!isValidUrl(url)) throw "Invalid URL"
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await this.axios.put(url, data, config);
                return response;
            } catch (error) {
                if (attempt === retries - 1) throw error;
            }
        }
    }

    async delete(url, config = {}, retries = 3) {
        if (!isValidUrl(url)) throw "Invalid URL"
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await this.axios.delete(url, config);
                return response;
            } catch (error) {
                if (attempt === retries - 1) throw error;
            }
        }
    }
}

module.exports = HttpClient;