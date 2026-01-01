const xbl = require("./xbl")

async function run(){
    const msauth =  "11-M.C510_SN1.0.U.ChzbSzAQOylOC1t4VtrTO0hNeiiNSYJBUIATTH*Ak5aWGZFyazyRTpPNGooqVrzwiqVoZFS4aaXOQGyVr3FiIxmZH6joxwJL9GbgBlnyUQcQAAyNLRtgcgMLpRE3hDln7vHogONao2rgQbJGsPL9gg2nhFjwoNjrxfFsbyPppq6osMqwOYl8zn6QPVCcoSZPj*6Bk3yaKpVzBNQRuPxQYivpbKqEj5Kj0znERlZtUnG!I!vg8KYehenl*0OipNzatp6cVZb0dkRQBbuoEGY*KhJvKD5YGJgdLGpMmQ7JjMH7h7vdyN27CrzNXjMCOjDcqlGVXfhpXLi6YnzOcrc1KhG7*jFMrtLdhmvZlffyUlDw"
    let xb = await xbl(msauth)
    console.log(`Got xblresult: ${JSON.stringify(xb)}`)
}


run()