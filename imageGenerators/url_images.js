const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { load } = require('cheerio');

async function downloadImage(url, filepath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function getImagesFromUrl(url) {
    const response = await axios.get(url);
    const $ = load(response.data);

    const images = [];
    $('img').each((i, elem) => {
        const src = $(elem).attr('data-src');
        if (src) {
            images.push(src);
        }
    });

    return images;
}

async function downloadImagesFromUrls(urls, surnames, folderPath) {
    const allImages = [];
    let remainingSurnames = surnames.slice();

    for (const url of urls) {
        const images = await getImagesFromUrl(url);
        allImages.push(...images);
        if (allImages.length >= surnames.length) {
            break;
        }
    }

    const selectedImages = allImages.slice(0, surnames.length);
    const usedNames = new Set();

    for (let i = 0; i < selectedImages.length; i++) {
        const imageUrl = selectedImages[i];
        let surname = remainingSurnames[i];
        let filename = `${surname}.jpg`;
        let filepath = path.join(folderPath, filename);
        let counter = 1;

        // 如果文件名已存在，添加数字后缀
        while (usedNames.has(filepath) || await fs.pathExists(filepath)) {
            filename = `${surname}_${counter}.jpg`;
            filepath = path.join(folderPath, filename);
            counter++;
        }

        usedNames.add(filepath);

        try {
            await downloadImage(imageUrl, filepath);
            console.log(`Downloaded ${filename}`);
        } catch (error) {
            console.error(`Failed to download image from ${imageUrl}:`, error);
        }
    }
}

module.exports = downloadImagesFromUrls;
