require('dotenv').config(); // 加载.env文件中的环境变量

const fs = require('fs-extra');
const path = require('path');
const COS = require('cos-nodejs-sdk-v5');

async function uploadToCOS(imagePath, imageName, folderName) {
    const cos = new COS({
        SecretId: process.env.SECRET_ID,
        SecretKey: process.env.SECRET_KEY
    });
    const bucket = process.env.BUCKET_NAME;
    const region = process.env.REGION;

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

function truncateTitle(title, maxLength) {
    if (title.length <= maxLength) {
        return title;
    }
    return title.substring(0, maxLength - 3) + '...';
}

async function generateArticle(images, folderName) {
    const imageUrls = [];
    for (const image of images) {
        const localPath = path.join(__dirname, folderName, image);
        const url = await uploadToCOS(localPath, image, folderName);
        imageUrls.push(url);
    }

    const imageNames = images.map(image => path.basename(image, path.extname(image))).join('、');
    const rawTitle = `你留姓氏我来做：${imageNames}`;
    const title = truncateTitle(rawTitle, 64);

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

    // 添加引流文字
    content += `
        <section style="margin-top: 20px; text-align: center;">
            <p style="margin-bottom: 0px; letter-spacing: 0.578px; text-wrap: wrap; text-align: center;">
                <span style="font-size: 20px;"></span>
            </p>
            <p style="margin-bottom: 0px; letter-spacing: 0.578px; text-wrap: wrap; text-align: center;">
                <span style="font-size: 20px;"><strong>【<span style="color: rgb(255, 41, 65);">关注</span>+<span style="color: rgb(255, 41, 65);">点赞</span>+<span style="color: rgb(255, 41, 65);">在看</span>】</strong></span>
            </p>
            <p style="margin-bottom: 0px; letter-spacing: 0.578px; text-wrap: wrap; text-align: center;">
                想要更多头像请留言自己姓氏
            </p>
            <p style="margin-bottom: 0px; letter-spacing: 0.578px; text-wrap: wrap; text-align: center;">
                文章<span style="color: rgb(255, 41, 65);">下方留言</span>姓氏：备注男女！
            </p>
            <p style="margin-bottom: 0px; letter-spacing: 0.578px; text-wrap: wrap; text-align: center;">
                今天留言！明天文章就有你要的头像！记得帮忙点<span style="color: rgb(255, 41, 65);">在看</span>
            </p>
        </section>`;

    return { title, content };
}

async function saveArticleToHTML(article, folderName) {
    const outputFilePath = path.join(__dirname, folderName, 'output.html');
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

async function generateHtml(folderPath) {
    const folderName = path.basename(folderPath);
    const images = await readImages(folderPath);
    if (images.length === 0) {
        console.error('No images found to generate HTML.');
        return;
    }
    const article = await generateArticle(images, folderName);
    await saveArticleToHTML(article, folderName);
}

module.exports = {
    generateHtml
};
