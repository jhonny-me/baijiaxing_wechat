require('dotenv').config(); // 加载.env文件中的环境变量

const fs = require('fs-extra');
const path = require('path');
const COS = require('cos-nodejs-sdk-v5');

const imageFolder = './百家姓流量主_2024_07_01'; // 目标文件夹
const folderName = path.basename(imageFolder); // 本地文件夹名称

// 腾讯云COS配置
const cos = new COS({
    SecretId: process.env.SECRET_ID,
    SecretKey: process.env.SECRET_KEY
});
const bucket = process.env.BUCKET_NAME;
const region = process.env.REGION;

// 上传图片到腾讯云COS
async function uploadToCOS(imagePath, imageName) {
    return new Promise((resolve, reject) => {
        cos.putObject({
            Bucket: bucket,
            Region: region,
            Key: `${folderName}/${imageName}`,
            Body: fs.createReadStream(imagePath)
        }, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(`https://${data.Location}`);
            }
        });
    });
}

async function readImages(folder) {
    try {
        const files = await fs.readdir(folder);
        const images = files.filter(file => ['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase()));
        return images;
    } catch (err) {
        console.error('Error reading image folder:', err);
    }
}

async function generateArticle(images) {
    const imageUrls = [];
    for (const image of images) {
        const localPath = path.join(imageFolder, image);
        const url = await uploadToCOS(localPath, image);
        imageUrls.push(url);
    }
    
    const imageNames = images.join('、');
    const title = `姓氏头像：${imageNames}`;
    let content = `<h1>${title}</h1>`;
    
    // 拼接图片URL为微信文章内容
    imageUrls.forEach((url, index) => {
        content += `<p><img src="${url}" alt="Image ${index + 1}"></p>`;
    });

    return { title, content };
}

async function saveArticleToHTML(article) {
    const outputFilePath = path.join(__dirname, 'output.html');
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${article.title}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
                h1 { font-size: 24px; color: #333; }
                p { margin: 0; padding: 0; }
                img { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>
            ${article.content}
        </body>
        </html>
    `;
    await fs.writeFile(outputFilePath, htmlContent);
    console.log(`Article saved to ${outputFilePath}`);
}

readImages(imageFolder).then(images => {
    generateArticle(images).then(article => {
        saveArticleToHTML(article).then(() => {
            console.log('Article content saved to output.html');
        });
    });
});
