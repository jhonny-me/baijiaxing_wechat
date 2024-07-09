const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function createCover(folderPath) {
    const files = await fs.readdir(folderPath);
    const images = files.filter(file => ['.jpg'].includes(path.extname(file).toLowerCase()));

    if (images.length < 2) {
        console.error('Not enough images to create a cover.');
        return;
    }

    const firstImagePath = path.join(folderPath, images[0]);
    const secondImagePath = path.join(folderPath, images[1]);

    const firstImage = await loadImage(firstImagePath);
    const secondImage = await loadImage(secondImagePath);

    const width = firstImage.width + secondImage.width;
    const height = Math.max(firstImage.height, secondImage.height);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(firstImage, 0, 0);
    ctx.drawImage(secondImage, firstImage.width, 0);

    const outputPath = path.join(folderPath, 'cover.png');
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on('finish', () => {
        console.log('Cover image created at', outputPath);
    });
}

module.exports = createCover;
