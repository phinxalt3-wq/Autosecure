module.exports = async (axios) => {
  let passed = false;

  try {
    const response = await axios.get(`https://account.live.com/proofs/manage/additional`);
    const secMatch = response?.data?.match(/var\s+t0\s*=\s*({[^;]+})/)?.[1];

    if (!secMatch) {
      console.log(`didn't find any sec data, tf?`);
      return passed;
    }

    const obj = JSON.parse(secMatch);
    const data = obj?.WLXAccount?.manageProofs?.tfa;

    if (data?.isOptInTfaEnabled === 1 || data?.isOptInTfaEnabled === "1") {
      passed = true;
    }
  } catch (err) {
    console.log(`Error fetching or parsing TFA data:`, err.message);
  }

  return passed;
}
