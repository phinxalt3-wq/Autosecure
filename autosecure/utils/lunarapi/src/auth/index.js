const { ClientboundWebSocketMessage, ServerboundWebSocketMessage } = require("../generated/protos/auth/auth")
const { convertToHighLow, generateHexDigest, publicKeyToPEM } =require("../util");
const { joinMinecraftServer } = require("./minecraft");
const {
    randomBytes: cryptoRandomBytes,
    publicEncrypt,
    constants: cryptoConstants,
} = require('node:crypto');



const createAuthenticatorConnection = () => {
    const ws = new WebSocket("wss://authenticator.lunarclientprod.com", {
        headers: {
            Accept: "application/x-protobuf",
        },
    });
    ws.binaryType = "arraybuffer";

    return ws;
};

const getLunarClientToken = async (uuid, username, accessToken) => {
    return new Promise((resolve, reject) => {

        if (!uuid || !username || !accessToken) {
            reject("Missing required parameters");
            return;
        }

        const authenticator = createAuthenticatorConnection();

        authenticator.onopen = () => {
            const payload = ServerboundWebSocketMessage.encode(
                ServerboundWebSocketMessage.create({
                    hello: {
                        identity: {
                            uuid: convertToHighLow(uuid),
                            username: username,
                        },
                    },
                })
            ).finish();

            authenticator.send(payload);
        };

        authenticator.onclose = (ev) => {
            if (ev.code === 1000) { // successful auth request
                return;
            }

            console.log(`Disconnected from the authenticator: ${ev.code} - ${ev.reason}`);
            reject("Unexpected disconnection");
        };

        authenticator.onerror = (e) => {
            reject("Error connecting to the authenticator");
        };

        authenticator.onmessage = async (ev) => {
            try {
                const data = new Uint8Array(ev.data);
                const { encryptionRequest, authSuccess } = ClientboundWebSocketMessage.decode(data);

                if (encryptionRequest) {
                    // most of this code is taken from the Lunar Client launcher, thanks guys!
                    const { publicKey: encodedPublicKey, randomBytes: encodedRandomBytes } = encryptionRequest;

                    const publicKey = Buffer.from(encodedPublicKey);
                    const randomBytes = Buffer.from(encodedRandomBytes);

                    const pem = publicKeyToPEM(publicKey);

                    const sharedSecret = cryptoRandomBytes(16);
                    const hexDigest = generateHexDigest(sharedSecret, publicKey);

                    const sharedSecretEncrypted = publicEncrypt(
                        {
                            key: pem,
                            padding: cryptoConstants.RSA_PKCS1_PADDING,
                        },
                        sharedSecret
                    );

                    const randomBytesEncrypted = publicEncrypt(
                        {
                            key: pem,
                            padding: cryptoConstants.RSA_PKCS1_PADDING,
                        },
                        randomBytes
                    );

                    
            /// UPDATE: From here assumes valid Minecraft Account

                    const joinedMinecraftServer = await joinMinecraftServer(accessToken, uuid, hexDigest);

                    if (!joinedMinecraftServer) {

                      authenticator.close();
                 reject("Failed to authenticate with Minecraft, please try again.");
     return;
                    }

                    

                    const payload = ServerboundWebSocketMessage.encode(
                        ServerboundWebSocketMessage.create({
                            encryptionResponse: {
                                secretKey: sharedSecretEncrypted,
                                publicKey: randomBytesEncrypted,
                            },
                        })
                    ).finish();
                    authenticator.send(payload);
                } else if (authSuccess) {
                    const { jwt } = authSuccess;
                    resolve(jwt);
                }
            } catch (e){
                console.log(e)
                authenticator.close();
                reject("Couldn't Authenticate with Lunar Client, please try again.");
            }
        };
    });
};

module.exports={createAuthenticatorConnection,getLunarClientToken}