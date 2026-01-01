const axios = require('axios');
const { invoicesMap } = require("./invoicemap")
const Invoice = require("./invoice")


/*
Fetch LTC Price
*/


async function fetchLtcPrice() {
    try {
        const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd`);
        if (data.litecoin && data.litecoin.usd) {
            return Number(data.litecoin.usd);
        } else {
            return await fetchFallback();
        }
    } catch (e) {
        console.log(e);
        return await fetchFallback();
    }
}

async function fetchFallback() {
    try {
        const { data } = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=LTC&tsyms=USD`);
        if (data.USD) {
            return Number(data.USD);
        } else {
            return "failed";
        }
    } catch (e) {
        console.log(e);
        return "failed";
    }
}

/*
Handler
*/


async function checkForInvoicesTransactions() {
    for (let invoice of invoicesMap.values()) {
        await invoice.checkForTransactions()
    }
}


async function addInvoice(invoice) {
    invoicesMap.set(invoice.invoiceId, invoice)
}
async function initializeInvoices() {
    console.log(`Initializing Invoices`)
    /** @type {{invoice_id,address,wallet}[]} */
    let invoices = await queryParams(`SELECT * FROM invoices`, [], "all", "invoices")
    for (let invoice of invoices) {
        if (invoice.status == "unchecked") {
            let invoiceObject = new Invoice(null, null, null, invoice.invoice_id)
            await invoiceObject.updateData()
            invoicesMap.set(invoice.invoice_id, invoiceObject)
        } else if (invoice.status == "checked") {
            console.log(`Sending money from ${invoice.address}`)
            let invoiceObject = new Invoice(null, null, null, invoice.invoice_id)
            if (await invoiceObject.sendToMain()) {
                await queryParams(`UPDATE invoices SET status=? WHERE invoice_id=?`, ["sent", invoiceObject.invoiceId])
            } else {
                console.log(`Failed while trying to send money in ${invoiceObject.invoiceId}`)
            }
        }
    }
    checkForInvoicesTransactions()
    setInterval(checkForInvoicesTransactions, 60000);

}





async function checkForTransactions(ctx) {
    if (!ctx.invoiceId || !ctx.address || !ctx.license) return false;
    if (validLtcAddress(ctx.address)) {
        try {
            let licenseQuery = await queryParams(`SELECT * FROM licenses WHERE license=?`, [ctx.license]);
            if (licenseQuery.length === 0) {
                ctx.status = "termedlicense";
                await queryParams(`UPDATE invoices SET status=? WHERE invoice_id=?`, ["termedlicense", ctx.invoiceId]);
                return false;
            }
            licenseQuery = licenseQuery[0];
            let time = licenseQuery.available;
            if (time === 0) {
                time = Date.now() + 86400000;
            }
            const data = await axios.get(`https://explorer.litecoin.net/api/address/${ctx.address}/txs/chain`);
            const utxos = data.data;
            if (Array.isArray(utxos)) {
                for (const utxo of utxos) {
                    if (Array.isArray(utxo.vout)) {
                        for (const vout of utxo.vout) {
                            if (vout.scriptpubkey_address === ctx.address) {
                                const txid = utxo.txid;
                                const txidQuery = await queryParams(`SELECT * FROM logs WHERE txid=?`, [txid]);
                                if (txidQuery.length !== 0) continue;
                                const valueInLtc = vout.value / 100000000;
                                const valueInUsd = valueInLtc * ctx.price;
                                const timeAdded = (valueInUsd * 518400000).toFixed(0);
                                const finalTime = parseInt(time) + parseInt(timeAdded);
                                console.log(`Added time for ${ctx.userid}, ${(timeAdded / 1000 / 60 / 60 / 24).toFixed(2)} Days, for ${valueInUsd}$ | ${valueInLtc} LTC`);
                                try {
                                    await queryParams(`INSERT INTO logs(txid, license, price, wallet, address, user_id, creator, invoice_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [txid, ctx.license, ctx.price, ctx.wallet, ctx.address, ctx.userid, ctx.creator, ctx.invoiceId]);
                                    await queryParams(`UPDATE licenses SET available=? WHERE license=?`, [finalTime, ctx.license]);
                                } catch (e) {
                                    console.log(e);
                                }
                            }
                        }
                    }
                }
            }

            if (ctx.availableUntil < Date.now()) {
                await queryParams(`UPDATE invoices SET status=? WHERE invoice_id=?`, ["checked", ctx.invoiceId]);
            }

        } catch (e) {
            console.log(`Error while trying to fetch UTXOs: ${e}`);
        }
    } else {
        console.log(`Invalid Address ${ctx.address}`);
        return false;
    }
}

module.exports = {
    fetchLtcPrice,
    checkForTransactions,
    initializeInvoices
};
