#!/usr/bin/env node
// Converts the ReddCoin brand SVG pinwheel to PNG at 192×192 and 512×512
// for the PWA manifest icons (icon-192.png, icon-512.png).
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../public/brand/ReddCoin-Pinwheel-CLR-256.svg');
const OUT_192 = path.resolve(__dirname, '../public/icon-192.png');
const OUT_512 = path.resolve(__dirname, '../public/icon-512.png');

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Source SVG not found:', SRC);
    process.exit(1);
  }

  await sharp(SRC).resize(192, 192).png().toFile(OUT_192);
  const size192 = fs.statSync(OUT_192).size;
  console.log(`icon-192.png  ${size192} bytes`);

  await sharp(SRC).resize(512, 512).png().toFile(OUT_512);
  const size512 = fs.statSync(OUT_512).size;
  console.log(`icon-512.png  ${size512} bytes`);

  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
