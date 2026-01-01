
const { LoginRequest, LoginResponse } =require("../generated/protos/assets/emotes");

class EmotesManager {
     server;

     emotes= null;

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

            const data = await this.server.sendMessage("lunarclient.websocket.emote.v1.EmoteService", "Login", message)
            if (!data) {
                reject(new Error("Could not login to cosmetics"));
                return;
            }

            this.emotes = LoginResponse.decode(data.output);
            resolve();
        })
    }


     getEmotes() {
        if (!this.emotes) {
            throw new Error("Cosmetics not initialized");
        }

        return this.emotes;
    }

     updateEmotes() {
        return this.login();
    }
}

module.exports={EmotesManager}