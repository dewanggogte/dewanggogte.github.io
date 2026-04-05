import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2c2c2c"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Accent line -->
  <rect x="80" y="240" width="50" height="3" rx="1.5" fill="#b85a3b"/>

  <!-- Name -->
  <text x="80" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="56" fill="#fdfcfb" font-weight="bold" letter-spacing="-0.5">Dewang Gogte</text>

  <!-- Tagline -->
  <text x="80" y="350" font-family="Georgia, 'Times New Roman', serif" font-size="22" fill="#999999">Startup operator. Bangalore, India.</text>

  <!-- URL -->
  <text x="80" y="540" font-family="Georgia, 'Times New Roman', serif" font-size="18" fill="#666666">dewanggogte.com</text>

  <!-- Subtle accent dot -->
  <circle cx="1100" cy="540" r="4" fill="#b85a3b" opacity="0.6"/>
</svg>`;

await sharp(Buffer.from(svg))
  .png()
  .toFile('public/og-default.png');

console.log('Created public/og-default.png (1200x630)');
