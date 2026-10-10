const fs = require('fs');
const { createCanvas } = require('canvas');

const width = 1200;
const height = 630;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#0B6E4F';
ctx.fillRect(0, 0, width, height);

// Logo circle
ctx.beginPath();
ctx.arc(150, 150, 60, 0, 2 * Math.PI, false);
ctx.fillStyle = '#f59e0b';
ctx.fill();

// Logo text 'SH'
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 50px serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('SH', 150, 150);

// "SchoolHub"
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 120px serif';
ctx.textAlign = 'left';
ctx.fillText('SchoolHub', 100, 350);

// Tagline
ctx.font = '40px sans-serif';
ctx.fillText('Where Nigerian schools grow', 100, 450);

// Flag
ctx.font = '80px sans-serif';
ctx.fillText('🇳🇬', 1050, 520);

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./public/og-image.png', buffer);
console.log('OG image created!');
