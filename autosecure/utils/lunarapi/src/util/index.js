const {
  createHash,
} = require('node:crypto');

function convertToHighLow(input) {
  const components = input.split("-");
  if (components.length !== 5) {
    throw new Error(`Invalid UUID string: ${input}`);
  }
  // Parse each component as hexadecimal (remove '0x' prefix for parseInt)
  const [c0, c1, c2, c3, c4] = components;

  // high64: (c0 << 32) | (c1 << 16) | c2
  let high64 = (BigInt(`0x${c0}`) << 32n) | (BigInt(`0x${c1}`) << 16n) | BigInt(`0x${c2}`);
  // low64: (c3 << 48) | c4
  let low64 = (BigInt(`0x${c3}`) << 48n) | BigInt(`0x${c4}`);

  return {
    high64,
    low64
  };
}

function convertToUuidStr(mostSigBits, leastSigBits) {
  function digits(val, digits2) {
    const hi = 1n << BigInt(digits2 * 4);
    return (hi | (val & (hi - 1n))).toString(16).substring(1);
  }
  return (
    digits(mostSigBits >> 32n, 8) +
    "-" +
    digits(mostSigBits >> 16n, 4) +
    "-" +
    digits(mostSigBits, 4) +
    "-" +
    digits(leastSigBits >> 48n, 4) +
    "-" +
    digits(leastSigBits, 12)
  );
}

const publicKeyToPEM = (publicKey) => {
  let pem = "-----BEGIN PUBLIC KEY-----\n";
  let base64Key = publicKey.toString("base64");
  const maxLineLength = 65;
  while (base64Key.length > 0) {
    pem += base64Key.substring(0, maxLineLength) + "\n";
    base64Key = base64Key.substring(maxLineLength);
  }
  pem += "-----END PUBLIC KEY-----\n";
  return pem;
};


// https://gist.github.com/andrewrk/4425843?permalink_comment_id=3265398#gistcomment-3265398
function generateHexDigest(secret, pubKey) {
  // The hex digest is the hash made below.
  // However, when this hash is negative (meaning its MSB is 1, as it is in two's complement), instead of leaving it
  // like that, we make it positive and simply put a '-' in front of it. This is a simple process: as you always do
  // with 2's complement you simply flip all bits and add 1

  let hash = createHash("sha1")
    .update("") // serverId = just an empty string
    .update(secret)
    .update(pubKey)
    .digest();

  // Negative check: check if the most significant bit of the hash is a 1.
  const isNegative = (hash.readUInt8(0) & (1 << 7)) !== 0; // when 0, it is positive

  if (isNegative) {
    // Flip all bits and add one. Start at the right to make sure the carry works
    const inverted = Buffer.allocUnsafe(hash.length);
    let carry = 0;
    for (let i = hash.length - 1; i >= 0; i--) {
      let num = hash.readUInt8(i) ^ 0b11111111; // a byte XOR a byte of 1's = the inverse of the byte
      if (i === hash.length - 1) num++;
      num += carry;
      carry = Math.max(0, num - 0b11111111);
      num = Math.min(0b11111111, num);
      inverted.writeUInt8(num, i);
    }
    hash = inverted;
  }
  let result = hash.toString("hex").replace(/^0+/, "");
  // If the result was negative, add a '-' sign
  if (isNegative) result = `-${result}`;

  return result;
}

module.exports = { convertToHighLow, convertToUuidStr, generateHexDigest,publicKeyToPEM }