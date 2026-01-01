const getKeyFromMnemonic = require("./getKeyFromMnemonic")
const validLtcAddress = require("./validLtcAddress")


/**
 * 
 * @param {string} mnemonic 
 * @returns {{message:string,success:boolean,address:string}}
 */
module.exports = (mnemonic) => {

    
    console.log(`mnemoc gotten: ${mnemonic}`)
    let key = getKeyFromMnemonic(mnemonic)
    const d = JSON.stringify(key)
    console.log(`key: ${d}`)
    if (key.success && key.privateKey) {
        console.log(`Success! ${key.privateKey}`)
        let address = key.privateKey.toAddress().toString()
        console.log(`address: ${address}`)
        if (validLtcAddress(address)) {
            return { address: address, success: true }
        } else {
            return { message: "Failed to get a valid LTC address", success: false }
        }
    } else {
        return { message: `Failed to get key from the mnemonic! ${key.message}`, success: false }
    }



}