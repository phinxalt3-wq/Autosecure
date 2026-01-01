const { v4: uuidv4 } = require('uuid');
const HdAddGen = require("hdaddressgenerator")
const bitcoin = require("bitcoinjs-lib")
const axios = require("axios");
const bip39 = require('bip39')
const sleep = require('../sleep');
const { queryParams } = require('../../utils/db');
const validLtcAddress = require('./blockchain/validLtcAddress');
const litecore = require("bitcore-lib-ltc")
const { mainltc, mainmemonics } = require("../../../config.json");
class Invoice {
    /**
     * 
     * @param {import('discord.js').Interaction} interaction 
     */
    constructor(license, userid, creator, invoiceId = null) {
        if (invoiceId) {
            this.invoiceId = invoiceId
        } else {
            const timestamp = Date.now(); // Current timestamp in milliseconds
            const uniqueId = uuidv4(); // Generate a UUID
            this.invoiceId = `INVOICE-${timestamp}-${uniqueId}`;
            this.availableUntil = Date.now() + 6000000
            this.price;
            this.address;
            this.license = license
            this.creator = creator
            this.userid = userid
            this.mnemonic;
        }
    }
    async updateData() {
        if (!this.invoiceId) return false
        let invoiceData = await queryParams(`SELECT * FROM invoices WHERE invoice_id=?`, [this.invoiceId], "all", "invoices")
        if (invoiceData?.length == 0) {
            console.log(`Couldn't find invoice`)
            return false
        }
        invoiceData = invoiceData[0]
        this.availableUntil = invoiceData.available_until
        this.price = invoiceData.price
        this.address = invoiceData.address
        this.wallet = invoiceData.wallet
        this.license = invoiceData.license
        this.mnemonic = invoiceData.wallet
        this.userid = invoiceData.user_id
        this.creator = invoiceData.creator
    }

    async generateWallet() {
        this.mnemonic = (await HdAddGen.generateMnemonic()).mnemonic
        const seed = bip39.mnemonicToSeedSync(this.mnemonic)
        const root = bitcoin.bip32.fromSeed(seed)
        const path = "m/44'/2'/0'/0/0";
        const child = root.derivePath(path)
        const privateKey = child.privateKey;
        const key = litecore.PrivateKey.fromBuffer(privateKey, litecore.Networks.mainnet);
        this.address = key.toAddress().toString()
    }
    async logInvoice() {
        try {
            await queryParams(`INSERT INTO invoices(invoice_id,price,address,wallet,license,available_until,user_id,creator) VALUES(?,?,?,?,?,?,?,?)`, [this.invoiceId, this.price, this.address, this.mnemonic, this.license, this.availableUntil, this.userid, this.creator], "all", "invoices")
            return true
        } catch (e) {
            console.log(e)
            return false
        }
    }
    async checkForTransactions() {
        if (!this.invoiceId || !this.address || !this.license) return false
        if (validLtcAddress(this.address)) {
            // console.log(`Checking for transactions for ${this.address}`)
            try {
                let licenseQuery = await queryParams(`SELECT * FROM licenses WHERE license=?`, [this.license])
                if (licenseQuery.length == 0) {
                    this.status = "termedlicense"
                    await queryParams(`UPDATE invoices SET status=? WHERE invoice_id=?`, ["termedlicense", this.invoiceId], "all", "invoices")
                    return false
                }
                licenseQuery = licenseQuery[0]
                let time = licenseQuery.available
                if (time == 0) {
                    time = Date.now() + 86400000
                }
                const data = await axios.get(`https://explorer.litecoin.net/api/address/${this.address}/txs/chain`)
                let utxos = data.data
                if (Array.isArray(utxos)) {
                    for (const utxo of utxos) {
                        if (Array.isArray(utxo.vout)) {
                            for (const vout of utxo.vout) {
                                if (vout.scriptpubkey_address === this.address) {
                                    const txid = utxo.txid;
                                    let txidQuery = await queryParams(`SELECT * FROM logs WHERE txid=?`, [txid], "all", "invoices")
                                    if (txidQuery.length != 0) continue
                                    const valueInLtc = vout.value / 100_000_000; // Using underscore for better readability
                                    const valueInUsd = valueInLtc * this.price;
                                    const timeAdded = (valueInUsd * 518_400_000).toFixed(0); // Milliseconds in 6 days
                                    let finalTime = parseInt(time) + timeAdded
                                    console.log(`Added time for ${this.userid}, ${(timeAdded / 1000 / 60 / 60 / 24).toFixed(2)} Days, for ${valueInUsd}$ | ${valueInLtc} LTC`)
                                    try {
                                        await queryParams(`INSERT INTO logs(txid,license,price,wallet,address,user_id,creator,invoice_id) VALUES(?,?,?,?,?,?,?,?)`, [txid, this.license, this.price, this.wallet, this.address, this.userid, this.creator, this.invoiceId], "all", "invoices")
                                        await queryParams(`UPDATE licenses SET available=? WHERE license=?`, [finalTime, this.license])
                                    } catch (e) {
                                        console.log(e)
                                    }
                                }
                            }
                        }
                    }
                }

                if (this.availableUntil < Date.now()) {
                    await queryParams(`UPDATE invoices SET status=? WHERE invoice_id=?`, ["checked", this.invoiceId], "all", "invoices")
                }

            } catch (e) {
                console.log(`Error while trying to fetch UTXOs ${e}`)
            }
        } else {
            console.log(`Invalid Address ${this.address}`)
            return false
        }
    }
    async sendToMain() {
        if (!mainltc || !this.mnemonic || !this.address) return false
        const { data } = await axios.get(`https://explorer.litecoin.net/api/address/${this.address}/utxo`)
        const seed = bip39.mnemonicToSeedSync(this.mnemonic)
        const root = bitcoin.bip32.fromSeed(seed)
        const path = "m/44'/2'/0'/0/0";
        const child = root.derivePath(path)
        const privateKey = child.privateKey;
        const keyPair = bitcoin.ECPair.fromPrivateKey(privateKey);
        const litecoinWIF = keyPair.toWIF()
        this.key = new litecore.PrivateKey.fromWIF(prvkey, litecore.Networks.livenet)
        if (!litecore.PrivateKey.isValid(this.key, litecore.Networks.mainnet)) {
            console.log(`Invalid private key`)
            return false
        }
        this.publicKey = this.key.toPublicKey()
        this.address = this.key.toAddress(litecore.Networks.mainnet)
    }
    async fetchLtcPrice() {
        try {
            const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd`)
            if (data.litecoin.usd) {
                this.price = data.litecoin.usd
            }
        } catch (e) {
            console.log(e)
        }
    }



}

module.exports = Invoice