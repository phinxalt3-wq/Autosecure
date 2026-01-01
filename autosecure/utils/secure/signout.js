
module.exports = async (axios) => {
  try {
    const response = await axios.post(
      "https://account.live.com/API/Proofs/DeleteDevices",
      {
        uiflvr: 1001,
        uaid: "abd2ca2a346c43c198c9ca7e4255f3bc",
        scid: 100109,
        hpgid: 201030
      }
    );

    if (response.data?.apiCanary) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error during device deletion:", error.message);
    return false;
  }
}
