const jsSHA = require("jssha");

class Totp {
  constructor(expiry = 30, length = 6) {
    this.expiry = expiry;
    this.length = length;
    if (this.length > 8 || this.length < 6) {
      throw "Error: invalid code length";
    }
  }

  dec2hex(s) {
    return s.toString(16).padStart(2, '0');
  }

  hex2dec(s) {
    return parseInt(s, 16);
  }

  base32tohex(base32) {
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let hex = '';
    let bits = 0;
    let buffer = 0;
    let bitCount = 0;

    for (let i = 0; i < base32.length; i++) {
      const val = base32chars.indexOf(base32[i].toUpperCase());
      if (val === -1) continue;
      buffer = (buffer << 5) | val;
      bitCount += 5;

      if (bitCount >= 8) {
        bits = buffer >> (bitCount - 8);
        hex += this.dec2hex(bits);
        bitCount -= 8;
        buffer &= (1 << bitCount) - 1;
      }
    }

    return hex;
  }

  leftpad(str, len, pad) {
    return str.padStart(len, pad);
  }

  getOtp(secret, now = new Date().getTime()) {
    const key = this.base32tohex(secret);
    const epoch = Math.floor(now / 1000);
    const time = this.leftpad(this.dec2hex(Math.floor(epoch / this.expiry)), 16, "0");

    const shaObj = new jsSHA("SHA-1", "HEX");
    shaObj.setHMACKey(key, "HEX");
    shaObj.update(time);
    const hmac = shaObj.getHMAC("HEX");

    const offset = this.hex2dec(hmac.slice(-1));
    let otp = (this.hex2dec(hmac.substr(offset * 2, 8)) & 0x7fffffff).toString();

    otp = otp.length > this.length ? otp.slice(otp.length - this.length) : this.leftpad(otp, this.length, "0");

    const nextResetEpoch = Math.floor(epoch / this.expiry) * this.expiry + this.expiry;

    return { otp, nextResetEpoch };
  }
}

async function generateotp(secretKey) {
  // console.log(`being called!`);
  try {
    const formattedSecret = secretKey.replace(/\s+/g, "").toUpperCase();

    if (!/^[A-Z2-7]+$/.test(formattedSecret)) {
      console.log(`not a good secretkey!`);
      return null;
    }

    const totp = new Totp();
    const { otp, nextResetEpoch } = totp.getOtp(formattedSecret);
    return { otp, nextResetEpoch };
  } catch (error) {
    console.error("eww:", error);
    return null;
  }
}

module.exports = generateotp;
