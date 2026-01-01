const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = async (amcSecAuth, amcSecAuthJWT, imageUrl) => {
  if (!amcSecAuth || !amcSecAuthJWT) {
    throw new Error("Both AMCSecAuth and AMCSecAuthJWT are required.");
  }

  try {
    const headResponse = await axios.head(imageUrl, { timeout: 5000 });
    const contentType = headResponse.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      return false;
    }
  } catch {
    return false;
  }

  const cookieHeader = `AMCSecAuth=${amcSecAuth}; AMCSecAuthJWT=${amcSecAuthJWT}`;
  const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Cookie": cookieHeader,
  };

  try {
    const imageFolder = path.join(__dirname, 'image');
    if (!fs.existsSync(imageFolder)) fs.mkdirSync(imageFolder);

    const randomName = crypto.randomBytes(4).toString('hex') + '.png';
    const imagePath = path.join(imageFolder, randomName);

    const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(imagePath);
      imageResponse.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const editPicturePage = await axios.get("https://account.microsoft.com/profile/edit-picture", {
      headers: commonHeaders
    });

    const $ = cheerio.load(editPicturePage.data);
    const token = $('input[name="__RequestVerificationToken"]').val();

    if (!token) {
      fs.unlink(imagePath, () => {});
      return false;
    }

    const form = new FormData();
    form.append('pictureFile', fs.createReadStream(imagePath));
    form.append('x', 0);
    form.append('y', 0);
    form.append('height', 256);
    form.append('width', 256);

    const apiHeaders = {
      ...form.getHeaders(),
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      "X-Requested-With": "XMLHttpRequest",
      "Connection": "keep-alive",
      "Origin": "https://account.microsoft.com",
      "Referer": "https://account.microsoft.com/profile/edit-picture",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "Pragma": "no-cache",
      "Cache-Control": "no-cache",
      "Cookie": cookieHeader,
      "__RequestVerificationToken": token,
    };

    const uploadResponse = await axios.post(
      "https://account.microsoft.com/profile/api/v1/personal-info/profile-picture",
      form,
      { headers: apiHeaders }
    );

    fs.unlink(imagePath, () => {});

    if (uploadResponse.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
  }
};
