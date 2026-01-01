const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require('axios');
const cheerio = require('cheerio');

// Set up Minecraft font
const fontPath = path.join(__dirname, 'assets/fonts/minecraft.ttf');
if (!fs.existsSync(fontPath)) {
  console.error('Font not found at:', fontPath);
  console.log('Please ensure minecraft.ttf is placed in:', fontPath);
  // Don't exit, continue with fallback fonts
} else {
  registerFont(fontPath, { family: 'Minecraft' });
}

const RANK_COLORS = {
  'OWNER': { bracket: '#FFFFFF', rank: '#FFFFFF', glow: '#FFFFFF', plus: '#FFFFFF' },
  'ADMIN': { bracket: '#FFFFFF', rank: '#FFFFFF', glow: '#FFFFFF', plus: '#FFFFFF' },
  'HELPER': { bracket: '#0000FF', rank: '#0000FF', glow: '#5555FF', plus: '#0000FF' },
  'MOD': { bracket: '#00AA00', rank: '#00AA00', glow: '#55FF55', plus: '#00AA00' },
  'PIG+++': { bracket: '#FFB6C1', rank: '#FF69B4', glow: '#FF1493', plus: '#4FC3FF' },
  'GM': { bracket: '#00FF00', rank: '#00FF00', glow: '#00FF00', plus: '#00FF00' },
  'YOUTUBE': { bracket: '#e45353ff', rank: '#ebe5e5ff', glow: '#b4b4b4ff', plus: '#FF0000' },
  'MVP++': { bracket: '#FFA500', rank: '#00FFFF', glow: '#FFB84D', plus: '#FF0000' },
  'MVP+': { bracket: '#00FFFF', rank: '#00FFFF', glow: '#66FFFF', plus: '#FFD700' },
  'MVP': { bracket: '#00CCCC', rank: '#00CCCC', glow: '#33FFFF', plus: '#FFD700' },
  'VIP+': { bracket: '#00FF00', rank: '#00FF00', glow: '#AAFFAA', plus: '#FFD700' },
  'VIP': { bracket: '#55FF55', rank: '#55FF55', glow: '#A0FFA0', plus: '#FFD700' },
  'NONE': { bracket: '#A2A2A2', rank: '#A2A2A2', glow: '#AAAAAA', plus: '#A2A2A2' },
};

function splitRankWithPluses(rankName) {
  if (!rankName) return [{ text: '', isPlus: false }];
  const match = rankName.match(/^([A-Z]+)(\+*)$/i);
  if (match) {
    const base = match[1];
    const pluses = match[2];
    const parts = [];
    if (base) parts.push({ text: base, isPlus: false });
    if (pluses) parts.push({ text: pluses, isPlus: true });
    return parts;
  }
  return [{ text: rankName, isPlus: false }];
}

function obscureUsername(username) {
  if (username.length <= 2) {
    return username;
  }
  const firstLetter = username.charAt(0);
  const lastLetter = username.charAt(username.length - 1);
  const middleAsterisks = '*'.repeat(username.length - 2);
  return firstLetter + middleAsterisks + lastLetter;
}

async function fetchPlayerRank(username) {
  try {
    let cleanUsername = username.trim().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[^\w\d_\-]/g, '').replace(/^[_\-]+|[_\-]+$/g, '').slice(0, 16);
    if (!cleanUsername) return 'NONE';
    let correctedName = cleanUsername;
    
    try {
      const { data } = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${cleanUsername}`);
      if (data && data.name) {
        correctedName = data.name;
      }
    } catch (mojangError) {
      console.log('Mojang API failed, using original username');
    }
    
    try {
      const { data } = await axios.get(`https://track.wreeper.com/player/${correctedName}`, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1"
        },
        timeout: 8000
      });
      
      const $ = cheerio.load(data);
      const html = $("body").html();
      const rankRaw = $("div").first().text();
      let rankMatch = rankRaw.match(/\[([^\]]+)\]/);
      let rank = rankMatch ? rankMatch[1] : null;
      
      if (rank) {
        console.log(`Found rank for ${correctedName}: ${rank}`);
        return rank;
      }
    } catch (wreperError) {
      console.log('Track.wreeper.com failed:', wreperError.message);
    }
    
    return 'NONE';
  } catch (error) {
    console.log('Failed to fetch rank:', error.message);
    return 'NONE';
  }
}

function drawRankTag(ctx, rank, x, y, size = 16) {
  if (!rank || rank === 'NONE') return 0; 
  
  const preset = RANK_COLORS[rank.toUpperCase()] || RANK_COLORS['NONE'];
  const bracketCol = preset.bracket || '#FF5555';
  const rankCol = preset.rank || '#FFFFFF';
  const plusCol = preset.plus || '#FFD700';
  
  ctx.save();
  ctx.font = `${size}px Minecraft`;
  let currentX = x;
  
  ctx.fillStyle = bracketCol;
  ctx.shadowColor = bracketCol;
  ctx.shadowBlur = 2;
  ctx.fillText('[', currentX, y);
  currentX += ctx.measureText('[').width;
  
  const rankParts = splitRankWithPluses(rank);
  for (const part of rankParts) {
    if (part.isPlus) {
      ctx.fillStyle = plusCol;
      ctx.shadowColor = plusCol;
    } else {
      ctx.fillStyle = rankCol;
      ctx.shadowColor = rankCol;
    }
    ctx.shadowBlur = 2;
    ctx.fillText(part.text, currentX, y);
    currentX += ctx.measureText(part.text).width;
  }
  
  ctx.fillStyle = bracketCol;
  ctx.shadowColor = bracketCol;
  ctx.shadowBlur = 2;
  ctx.fillText(']', currentX, y);
  currentX += ctx.measureText(']').width;
  
  ctx.restore();
  return currentX - x;
}

async function makeCard(stats, outputPath = "output.png") {
  const width = 800, height = 450;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  
  // Create background
  const bgDir = path.join(__dirname, "assets/backgrounds");
  const files = fs.readdirSync(bgDir).filter(f =>
    /\.(jpg|jpeg|png)$/i.test(f)
  );

  const randomFile = files[Math.floor(Math.random() * files.length)];
  const bgImage = await loadImage(path.join(bgDir, randomFile));

  try {
    // Apply blur filter to the background (20% blur effect)
    ctx.filter = 'blur(4px)';
    ctx.drawImage(bgImage, 0, 0, width, height);
    // Reset filter for subsequent drawings
    ctx.filter = 'none';
  } catch {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, width, height);
  }
  
  // Create a simple dark overlay template instead of loading template.png
  const overlay = ctx.createLinearGradient(0, 0, width, height);
  overlay.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
  overlay.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, width, height);

  // Create rounded rectangular boxes for stats display like in the second image
  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Username header box (top)
  ctx.fillStyle = 'rgba(10, 10, 10, 0.7)';
  drawRoundedRect(ctx, 308.25, 16.875, 445.5 * 1.05, 68.90625 * 1.02, 18); // Extended 5% right, 2% down
  ctx.fill();

  // Left avatar box
  ctx.fillStyle = 'rgba(10, 10, 10, 0.7)';
  drawRoundedRect(ctx, 26.26, 23.6, 242, 401.856, 18);
  ctx.fill();

  // Stats boxes (8 boxes in 2 columns, 4 rows each)
  const boxWidth = 224.64;
  const boxHeight = 69.255;
  const leftColumnX = 304.96;
  const rightColumnX = 484.96 + (224.64 * 0.3); // Move right column 30% to the right
  const startY = 105.57;
  const boxSpacing = 100;

  // Left column boxes
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = 'rgba(5, 5, 5, 0.7)';
    let yPosition;
    if (i === 1) {
      // Move row 2 (index 1) up by 15%
      yPosition = (startY + (i * boxSpacing)) - (boxSpacing * 0.15);
    } else if (i === 2) {
      // Move row 3 (index 2) up by 30%
      yPosition = (startY + (i * boxSpacing)) - (boxSpacing * 0.30);
    } else if (i === 3) {
      // Move row 4 (index 3) up by 45%
      yPosition = (startY + (i * boxSpacing)) - (boxSpacing * 0.45);
    } else {
      // Row 1 stays in original position
      yPosition = startY + (i * boxSpacing);
    }
    drawRoundedRect(ctx, leftColumnX, yPosition, boxWidth, boxHeight, 18);
    ctx.fill();
  }

  // Right column boxes  
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = 'rgba(5, 5, 5, 0.7)';
    let yPosition;
    if (i === 1) {
      // Move row 2 (index 1) up by 15%
      yPosition = (startY + (i * boxSpacing)) - (boxSpacing * 0.15);
    } else if (i === 2) {
      // Move row 3 (index 2) up by 30%
      yPosition = (startY + (i * boxSpacing)) - (boxSpacing * 0.30);
    } else if (i === 3) {
      // Move row 4 (index 3) up by 45%
      yPosition = (startY + (i * boxSpacing)) - (boxSpacing * 0.45);
    } else {
      // Row 1 stays in original position
      yPosition = startY + (i * boxSpacing);
    }
    drawRoundedRect(ctx, rightColumnX, yPosition, boxWidth, boxHeight, 18);
    ctx.fill();
  }
  
  const username = stats.username;
  const usernameForAvatar = username.toLowerCase();
  const imageDir = path.join(__dirname, 'db', 'image');
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }
  
  const localImagePath = path.join(imageDir, `${usernameForAvatar}.png`);
  let avt;
  
  try {
    if (fs.existsSync(localImagePath)) {
      console.log(`Using cached avatar for ${usernameForAvatar}`);
      avt = await loadImage(localImagePath);
    } else {
      console.log(`Downloading avatar for ${usernameForAvatar}`);
      const avatarUrls = [
        `https://vzge.me/full/384/${usernameForAvatar}`,
        `https://mc-heads.net/body/${usernameForAvatar}/384`,
        `https://crafatar.com/renders/body/${usernameForAvatar}?size=384&overlay`,
        `https://minotar.net/body/${usernameForAvatar}/384`
      ];
      
      let downloadSuccess = false;
      for (const url of avatarUrls) {
        try {
          console.log(`Trying ${url}`);
          const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'image/png,image/jpeg,image/*,*/*;q=0.9',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            timeout: 15000,
            maxRedirects: 5
          });
          fs.writeFileSync(localImagePath, response.data);
          console.log(`Successfully downloaded and saved avatar for ${usernameForAvatar}`);
          downloadSuccess = true;
          break;
        } catch (urlError) {
          console.log(`Failed to download from ${url}: ${urlError.message}`);
          continue;
        }
      }
      
      if (downloadSuccess) {
        avt = await loadImage(localImagePath);
      } else {
        throw new Error('All avatar services failed');
      }
    }
  } catch (error) {
    console.log(`Failed to load/download avatar for ${usernameForAvatar}:`, error.message);
    try {
      const defaultPath = path.join(imageDir, 'steve.png');
      if (fs.existsSync(defaultPath)) {
        avt = await loadImage(defaultPath);
      } else {
        const steveUrls = [
          `https://vzge.me/full/384/steve`,
          `https://mc-heads.net/body/steve/384`,
          `https://crafatar.com/renders/body/8667ba71-b85a-4004-af54-457a9734eed7?size=384&overlay`,
          `https://minotar.net/body/steve/384`
        ];
        
        let steveSuccess = false;
        for (const url of steveUrls) {
          try {
            console.log(`Downloading steve from ${url}`);
            const steveResponse = await axios.get(url, {
              responseType: 'arraybuffer',
              headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/png,image/jpeg,image/*,*/*;q=0.9',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
              timeout: 15000,
              maxRedirects: 5
            });
            fs.writeFileSync(defaultPath, steveResponse.data);
            avt = await loadImage(defaultPath);
            steveSuccess = true;
            break;
          } catch (steveError) {
            console.log(`Failed to download steve from ${url}: ${steveError.message}`);
            continue;
          }
        }
        
        if (!steveSuccess) {
          throw new Error('All steve services failed');
        }
      }
    } catch (fallbackError) {
      console.log(`Failed to load fallback avatar, creating placeholder`);
      const avatarCanvas = new Canvas(190, 300);
      const avatarCtx = avatarCanvas.getContext("2d");
      avatarCtx.fillStyle = "#8B4513";
      avatarCtx.fillRect(0, 0, 190, 300);
      avatarCtx.fillStyle = "#FFFFFF";
      avatarCtx.font = "24px Arial";
      avatarCtx.textAlign = "center";
      avatarCtx.fillText("?", 95, 150);
      avt = avatarCanvas;
    }
  }
  
  ctx.drawImage(avt, 54, 80, 190, 300);
  
  function drawAlignedStat(text, centerX, y, size, color = "#fff", align = "center") {
    ctx.font = size+'px Minecraft';
    ctx.fillStyle = color;
    ctx.shadowBlur = 6;
    const textWidth = ctx.measureText(text).width;
    let x = centerX;
    if (align === "center") {
      x = centerX - (textWidth / 2) - 60;
    } else if (align === "right") {
      x = centerX - textWidth;
    }
    ctx.fillText(text, x, y);
  }
  
  const usernameCenterX = 600;
  const playerRank = await fetchPlayerRank(username);
  ctx.font = '22px Minecraft';
  const rankWidth = playerRank && playerRank !== 'NONE' 
    ? ctx.measureText(`[${playerRank}] `).width 
    : 0;
  const obscuredUsername = obscureUsername(username);
  const usernameWidth = ctx.measureText(obscuredUsername).width;
  const totalWidth = rankWidth + usernameWidth;
  const startX = usernameCenterX - (totalWidth / 2) - 65;
  let currentX = startX;
  
  if (playerRank && playerRank !== 'NONE') {
    const rankTagWidth = drawRankTag(ctx, playerRank, currentX, 66.15, 24.2);
    currentX += rankTagWidth + 5;
  }
  
  const preset = RANK_COLORS[playerRank.toUpperCase()] || RANK_COLORS['NONE'];
  ctx.font = '24.2px Minecraft';
  ctx.fillStyle = preset.bracket;
  ctx.fillText(obscuredUsername, currentX, 66.15);
  
  // Draw stats
  drawAlignedStat(`Networth`, 475, 139, 16, "#dfa52aff", "center");
  drawAlignedStat(`${stats.networth || "0"}`, 475, 162, 16, "#fff", "center");
  
  drawAlignedStat(`Bedwars Stars`, 475, 219, 16, "rgba(14, 192, 59, 1)", "center");
  drawAlignedStat(`${stats.bedwars || "0"}`, 475, 242, 16, "#fff", "center");
  
  drawAlignedStat(`Duel KDR`, 475, 302, 16, "rgba(53, 55, 187, 1)", "center");
  drawAlignedStat(`${stats.duelKDR || "0"}`, 475, 325, 16, "#fff", "center");
  
  drawAlignedStat(`Plus Colour`, 477, 385, 16, "rgba(235, 232, 88, 1)", "center");
  drawAlignedStat(`${stats.plusColour || "None"}`, 475, 408, 16, "#fff", "center");
  
  drawAlignedStat(`SB Level`, 728, 139, 16, "#1cacffff", "center");
  drawAlignedStat(`${stats.sbLevel || "0"}`, 728, 162, 16, "#fff", "center");
  
  drawAlignedStat(`Network Level`, 728, 219, 16, "rgba(190, 33, 238, 1)", "center");
  drawAlignedStat(`${stats.networkLevel || "0"}`, 728, 242, 16, "#fff", "center");
  
  drawAlignedStat(`Duel Winstreak`, 728, 302, 16, "rgba(206, 80, 80, 1)", "center");
  drawAlignedStat(`${stats.duelWinstreak || "0"}`, 728, 325, 16, "#fff", "center");
  
  drawAlignedStat(`Gifted`, 728, 385, 16, "rgba(206, 97, 240, 1)", "center");
  drawAlignedStat(`${stats.gifted || "0"}`, 728, 408, 16, "#fff", "center");
  
  // Row 4 stats
  drawAlignedStat(`Rank`, 475, 465, 16, "rgba(255, 215, 0, 1)", "center");
  drawAlignedStat(`${stats.rank || "None"}`, 475, 488, 16, "#fff", "center");
  
  drawAlignedStat(`Capes`, 728, 465, 16, "rgba(138, 43, 226, 1)", "center");
  drawAlignedStat(`${stats.capes || "0"}`, 728, 488, 16, "#fff", "center");
  
  const buffer = await canvas.toBuffer("png");
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, buffer);
  console.log(`[drawHit] Image saved to: ${outputPath}`);
  
  return buffer;
}

module.exports = { makeCard };