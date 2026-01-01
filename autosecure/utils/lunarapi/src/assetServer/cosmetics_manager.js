const { LoginRequest, LoginResponse, UpdateCosmeticSettingsRequest, UpdateCosmeticSettingsResponse } = require("../generated/protos/assets/cosmetics");

class CosmeticsManager {
    server;

    cosmetics = null;

    ready;
    readyResolve;
    readyReject;

    constructor(assetServer) {
        this.server = assetServer;

        this.ready = new Promise((resolve, reject) => {
            this.readyResolve = resolve;
            this.readyReject = reject;
        });

        this.login().then(() => {
            this.readyResolve();
        }).catch((err) => {
            this.readyReject(err);
        })
    }

    async login() {
        return new Promise(async (resolve, reject) => {
            const message = LoginRequest.encode(LoginRequest.create({})).finish();

            const data = await this.server.sendMessage("lunarclient.websocket.cosmetic.v1.CosmeticService", "Login", message)
            if (!data) {
                reject(new Error("Could not login to cosmetics"));
                return;
            }

            this.cosmetics = LoginResponse.decode(data.output);
            resolve();
        })
    }

    async updateCosmeticSettings(request) {
        const message = UpdateCosmeticSettingsRequest.encode(request).finish();

        const data = await this.server.sendMessage("lunarclient.websocket.cosmetic.v1.CosmeticService", "UpdateCosmeticSettings", message)
        if (!data) {
            throw new Error("Could not update cosmetics");
        }
    }

    getCosmetics() {
        if (!this.cosmetics) {
            throw new Error("Cosmetics not initialized");
        }

        return this.cosmetics;
    }

    updateCosmetics() {
        return this.login();
    }
}

module.exports={CosmeticsManager}