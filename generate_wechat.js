require('dotenv').config(); // 加载.env文件中的环境变量

const fs = require('fs-extra');
const path = require('path');
const COS = require('cos-nodejs-sdk-v5');
const WechatAPI = require('wechat-api');

const imageFolder = './百家姓流量主_2024_07_01'; // 目标文件夹
const appID = process.env.APP_ID; // 你的微信AppID
const appSecret = process.env.APP_SECRET; // 你的微信AppSecret
const api = new WechatAPI(appID, appSecret);

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
            Key: imageName,
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

// 上传图片到微信并获取Media ID
async function uploadImageToWechat(imagePath) {
    return new Promise((resolve, reject) => {
        api.uploadMedia(imagePath, 'image', (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.media_id);
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
    const firstImagePath = path.join(imageFolder, images[0]);
    const thumbMediaId = await uploadImageToWechat(firstImagePath); // 上传第一张图并获取Media ID

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
        content += `<img src="${url}" alt="Image ${index + 1}"><br>`;
    });

    return { title, content, thumbMediaId };
}

async function publishArticle(article) {
    const articles = [{
        title: article.title,
        thumb_media_id: article.thumbMediaId, // 使用第一张图片的Media ID
        author: '姓氏头像👉',
        digest: '全是些好看的头像',
        show_cover_pic: 1,
        content: article.content,
        content_source_url: '',
        need_open_comment: 1,
        only_fans_can_comment: 0
    }];

    api.uploadNews(articles, (err, result) => {
        if (err) {
            console.error('Error uploading article:', err);
        } else {
            console.log('Article uploaded:', result);
        }
    });
}

readImages(imageFolder).then(images => {
    generateArticle(images).then(article => {
        publishArticle(article).then(() => {
            console.log('Article published to WeChat.');
        });
    });
});
