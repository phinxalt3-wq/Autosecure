module.exports = async (axios) => {
    const { data } = await axios.post(
        `https://account.live.com/API/Proofs/DisableTfa`,
        `{"uiflvr":1001,"uaid":"9b699236f4e94df58a700330b45a9b6b","scid":100109,"hpgid":201030}`,
        {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/json"
            }
        }
    );

    if (data?.apiCanary) return true;
    return false;
}
