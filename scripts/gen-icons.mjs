// Sinh icon PWA không cần thư viện ngoài (tránh thêm dep chỉ để vẽ 2 file PNG).
// Chạy: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const CAM = [0xea, 0x58, 0x0c]; // #EA580C
const TRANG = [0xff, 0xff, 0xff];

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixel) {
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(size * 3 + 1); // filter byte 0 + RGB
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y, size);
      row[1 + x * 3] = r;
      row[2 + x * 3] = g;
      row[3 + x * 3] = b;
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Nền cam + tô trắng: bát cơm (nửa hình tròn + đế) và 3 vệt khói. */
function veIcon(x, y, size) {
  const u = size / 100; // toạ độ theo lưới 100×100 cho dễ chỉnh
  const px = x / u;
  const py = y / u;

  // Bát: nửa dưới hình tròn tâm (50,62) bán kính 27
  const dx = px - 50;
  const dy = py - 62;
  if (py >= 62 && dx * dx + dy * dy <= 27 * 27) return TRANG;
  // Vành bát
  if (py >= 58 && py <= 63 && Math.abs(dx) <= 31) return TRANG;
  // Đế bát
  if (py >= 88 && py <= 93 && Math.abs(dx) <= 14) return TRANG;

  // Cơm đầy: nửa trên hình tròn nhỏ nhô lên khỏi vành
  const ry = py - 58;
  if (py < 58 && dx * dx + ry * ry * 2.2 <= 20 * 20) return TRANG;

  // 3 vệt khói
  for (const [cx, top, h] of [
    [36, 14, 22],
    [50, 8, 26],
    [64, 14, 22],
  ]) {
    const luon = cx + Math.sin(((py - top) / h) * Math.PI * 1.5) * 3.2;
    if (py >= top && py <= top + h && Math.abs(px - luon) <= 2.4) return TRANG;
  }

  return CAM;
}

mkdirSync('public/icons', { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(`public/icons/icon-${size}.png`, png(size, veIcon));
  console.log(`✓ public/icons/icon-${size}.png`);
}
