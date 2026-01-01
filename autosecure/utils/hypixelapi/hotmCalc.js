module.exports = (xp) => {
 //   console.log(xp)
    let data = [0, 3000, 12000, 37000, 97000, 197000, 347000,557000,847000,1247000]
    let prev
    let i =0
    for (let v of data) {
        i++
        if (xp >= v) {
            prev=i
        } else { 
            return prev
        }
    }
    return 10
}