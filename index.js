const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { generateHtml } = require('./generate_wechat');
const imageGenerators = require('./imageGenerators');
const phraseGenerators = require('./phraseGenerators');
const surnameGenerators = require('./surnameGenerators');
const createCover = require('./imageGenerators/cover');
require('dotenv').config();

const args = process.argv.slice(2);
const selectedImageGenerator = args.includes('--imageGenerator') ? args[args.indexOf('--imageGenerator') + 1] : 'first';
const selectedPhraseGenerator = args.includes('--phraseGenerator') ? args[args.indexOf('--phraseGenerator') + 1] : 'chengyu';
const selectedSurnameGenerator = args.includes('--surnameGenerator') ? args[args.indexOf('--surnameGenerator') + 1] : 'randomThirty';

const downloadImage = imageGenerators[selectedImageGenerator];
const generatePhrases = phraseGenerators[selectedPhraseGenerator];
const generateSurnames = surnameGenerators[selectedSurnameGenerator];

async function main() {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}`;
    const folderName = `百家姓流量主_${formattedDate}`;
    const folderPath = path.join(__dirname, folderName);

    await fs.ensureDir(folderPath);

    const selectedSurnames = generateSurnames();
    const phrases = Array(30).fill('非常好');//await generatePhrases(selectedSurnames);

    for (let i = 0; i < selectedSurnames.length; i++) {
        const surname = selectedSurnames[i];
        const phrase = phrases[i];
        console.log(`Downloading image for surname ${surname} with phrase ${phrase}`);
        await downloadImage(surname, phrase, folderPath);
    }

    // 调用生成HTML的函数
    await generateHtml(folderPath);

    // 创建封面图片
    await createCover(folderPath);
}

main().catch(console.error);
