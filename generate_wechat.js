require('dotenv').config(); // 加载.env文件中的环境变量

const fs = require('fs-extra');
const path = require('path');
const COS = require('cos-nodejs-sdk-v5');

// 腾讯云COS配置
const cos = new COS({
    SecretId: process.env.SECRET_ID,
    SecretKey: process.env.SECRET_KEY
});
const bucket = process.env.BUCKET_NAME;
const region = process.env.REGION;

// 上传图片到腾讯云COS
async function uploadToCOS(folderName, imagePath, imageName) {
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
        const images = files.filter(file => ['.jpg'].includes(path.extname(file).toLowerCase()));
        return images;
    } catch (err) {
        console.error('Error reading image folder:', err);
    }
}

async function generateArticle(folderName, imageFolder, images) {
    const imageUrls = [];
    for (const image of images) {
        const localPath = path.join(imageFolder, image);
        const url = await uploadToCOS(folderName, localPath, image);
        imageUrls.push(url);
    }
    
    const imageNames = images.map(image => path.basename(image, path.extname(image))).join('、');
    const title = `姓氏头像：${imageNames}`;
    let content = `<h1>${title}</h1><table>`;
    
    // 拼接图片URL为微信文章内容
    for (let i = 0; i < imageUrls.length; i += 2) {
        content += '<tr>';
        content += `<td style="padding: 10px; width: 50%;"><img src="${imageUrls[i]}" alt="Image ${i + 1}" style="width: 100%; max-width: 257px;"></td>`;
        if (i + 1 < imageUrls.length) {
            content += `<td style="padding: 10px; width: 50%;"><img src="${imageUrls[i + 1]}" alt="Image ${i + 2}" style="width: 100%; max-width: 257px;"></td>`;
        } else {
            content += '<td style="width: 50%;"></td>';
        }
        content += '</tr>';
    }
    content += '</table>';

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
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; max-width: 677px; margin: 0 auto; padding: 0 5%; }
                h1 { font-size: 24px; color: #333; }
                table { width: 100%; border-collapse: collapse; border: none; }
                td { padding: 10px; border: none; }
                img { width: 100%; max-width: 257px; height: auto; }
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

async function generateHtml(imageFolder) {
    const folderName = path.basename(imageFolder); // 本地文件夹名称
    const images = await readImages(imageFolder);
    const article = await generateArticle(folderName, imageFolder, images);
    await saveArticleToHTML(article);
}

module.exports = { generateHtml };
