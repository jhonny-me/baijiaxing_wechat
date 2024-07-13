const Jimp = require('jimp');
const fs = require('fs-extra');
const path = require('path');

async function createCover(folderPath) {
    const files = await fs.readdir(folderPath);
    const images = files.filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'));

    if (images.length < 2) {
        console.error('Not enough images to create a cover.');
        return;
    }

    const margin = 10; // Margin between images
    const firstImagePath = path.join(folderPath, images[0]);
    const secondImagePath = path.join(folderPath, images[1]);

    const [firstImage, secondImage] = await Promise.all([
        Jimp.read(firstImagePath),
        Jimp.read(secondImagePath)
    ]);

    const width = firstImage.bitmap.width + secondImage.bitmap.width + margin;
    const height = Math.max(firstImage.bitmap.height, secondImage.bitmap.height);

    const cover = new Jimp(width, height, 0xffffffff); // White background

    cover.composite(firstImage, 0, 0);
    cover.composite(secondImage, firstImage.bitmap.width + margin, 0);

    const coverPath = path.join(folderPath, 'cover.png');
    await cover.writeAsync(coverPath);
    console.log(`Cover image created at ${coverPath}`);
}

module.exports = createCover;
