const { Handshake, MinecraftIdentity_Type } = require("../generated/protos/assets/assets");
const { ClientboundWebSocketMessage, ServerboundWebSocketMessage, WebSocketRpcResponse } = require("../generated/protos/assets/assets_common");
const { SessionIdentifyPush } = require("../generated/protos/assets/push");
const { convertToHighLow, convertToUuidStr } = require("../util");
const { CosmeticsManager } = require("./cosmetics_manager")
const { EmotesManager } = require("./emotes_manager");

class AssetServer {
    ws = null;
    cosmeticmanager = null;
    emotesManager = null;
    inFlightRequests = new Map();
    ready;
    readyResolve;
    readyReject;
    requestId = 0;
    _isConnected = false;

    constructor(accessToken, uuid, username, jwtToken) {
        this.ready = new Promise((resolve, reject) => {
            this.readyResolve = resolve;
            this.readyReject = reject;
        });

        this.ws = this.connectToAssetServer(accessToken, uuid, username, jwtToken);
    }

    connectToAssetServer(accessToken, uuid, username, jwtToken) {
        const handshake = Handshake.create({
            launcherHandshake: {
                environment: "production"
            },
            identity: {
                authenticatorJwt: jwtToken,
                player: {
                    uuid: convertToHighLow(uuid),
                    username: username,
                },
                type: MinecraftIdentity_Type.TYPE_MOJANG,
            }
        });

        const handshakeB64 = Buffer.from(
            Handshake.encode(handshake).finish()
        ).toString("base64");

        const ws = new WebSocket("wss://websocket.lunarclientprod.com/lunar-socket-client", {
            headers: {
                "Handshake-Base64": handshakeB64,
                Accept: "application/x-protobuf",
            },
        });

        ws.binaryType = "arraybuffer";

        ws.onopen = () => {
            this._isConnected = true;
            this.onOpen();
        };
        ws.onerror = (error) => {
            this._isConnected = false;
            this.onError(error);
        };
        ws.onclose = () => {
            this._isConnected = false;
            this.onClose();
        };
        ws.onmessage = this.onMessage.bind(this);

        return ws;
    }

    onOpen() {
        console.log("Connected to the asset server");
        this.cosmeticmanager = new CosmeticsManager(this);
        this.emotesManager = new EmotesManager(this);

        Promise.all([
            this.cosmeticmanager.ready,
            this.emotesManager.ready,
        ]).then(() => {
            this.readyResolve();
        }).catch((err) => {
            this.readyReject(err);
        });
    }

    onError(error) {
        console.error("Error connecting to the asset server:", error);
        this._isConnected = false;
        this.readyReject(error);
        
        // Reject all pending requests
        for (const [requestId, { reject }] of this.inFlightRequests) {
            reject(new Error("WebSocket connection failed"));
        }
        this.inFlightRequests.clear();
    }

    onClose() {
        console.log("Disconnected from the asset server");
        this._isConnected = false;
        
        // Reject all pending requests
        for (const [requestId, { reject }] of this.inFlightRequests) {
            reject(new Error("WebSocket connection closed"));
        }
        this.inFlightRequests.clear();
    }

    onMessage(event) {
        const data = new Uint8Array(event.data);
        const packet = ClientboundWebSocketMessage.decode(data);

        if (packet.pushNotification) {
            if (packet.pushNotification.typeUrl === "type.googleapis.com/lunarclient.websocket.handshake.v1.SessionIdentifyPush") {
                const sessionIdentify = SessionIdentifyPush.decode(packet.pushNotification.value);
                console.log(
                    "Received session id",
                    convertToUuidStr(sessionIdentify.sessionId?.high64, sessionIdentify.sessionId?.low64)
                );
            } else {
                console.log("Push Notification:", packet.pushNotification);
            }
        } else if (packet.rpcResponse) {
            this.handleRpcResponse(packet);
        }
    }

    async sendMessage(service, method, input) {
        if (!this._isConnected) {
            throw new Error("WebSocket is not connected");
        }

        return new Promise((resolve, reject) => {
            const currentRequestId = (this.requestId++).toString();
            const requestIdBytes = new TextEncoder().encode(currentRequestId);

            this.inFlightRequests.set(currentRequestId, { resolve, reject });

            const message = ServerboundWebSocketMessage.encode(
                ServerboundWebSocketMessage.create({
                    requestId: requestIdBytes,
                    service,
                    method,
                    input,
                })
            );

            try {
                this.ws.send(message.finish());
            } catch (err) {
                this.inFlightRequests.delete(currentRequestId);
                reject(err);
            }
        });
    }

    handleRpcResponse(packet) {
        if (packet.rpcResponse && packet.rpcResponse.requestId) {
            const requestIdStr = new TextDecoder().decode(packet.rpcResponse.requestId);
            const inflight = this.inFlightRequests.get(requestIdStr);

            if (inflight) {
                this.inFlightRequests.delete(requestIdStr);
                inflight.resolve(packet.rpcResponse);
            } else {
                console.warn("Received response for unknown request ID:", requestIdStr);
            }
        }
    }

    getCosmeticManager() {
        if (!this.cosmeticmanager) {
            throw new Error("Cosmetics not initialized");
        }
        return this.cosmeticmanager;
    }

    getEmotesManager() {
        if (!this.emotesManager) {
            throw new Error("Emotes not initialized");
        }
        return this.emotesManager;
    }

    async disconnect() {
        if (this.ws) {
            try {
                // Clean up before closing
                this._isConnected = false;
                
                // Reject all pending requests
                for (const [requestId, { reject }] of this.inFlightRequests) {
                    reject(new Error("WebSocket connection closed by client"));
                }
                this.inFlightRequests.clear();

                // Close the WebSocket
                if (this.ws.readyState === WebSocket.OPEN || 
                    this.ws.readyState === WebSocket.CONNECTING) {
                    this.ws.close();
                }
            } catch (err) {
                console.error("Error while disconnecting:", err);
            } finally {
                this.ws = null;
            }
        }
    }

    isConnected() {
        return this._isConnected;
    }
}

module.exports = { AssetServer };