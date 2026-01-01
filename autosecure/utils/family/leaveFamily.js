const getPuid = require('./getPuid')

module.exports = async function leaveFamily(axios){
     let data = await axios.get(`https://account.microsoft.com/family/api/roster`, {
        headers: {
            "X-Requested-With": "XMLHttpRequest",
        }
    })


    if (data.data){
        family = data.data
    } else{
        return false;
    }

    if (family?.Members?.length > 0) {
      //  console.log('has family!')
        let puid = await getPuid(axios)
        if (!puid){
            console.log('coudnt get puid')
            return false
        }
        const data = await axios.delete(`https://account.microsoft.com/family/api/member?removeSet=Msa:${puid}`, {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            }
        })
        if (data?.data?.result == 0) {
            return true
        } else {
            return false
        }
    }

    /// This shouldn't even happen rn
    return "Couldn't detect a family"
}