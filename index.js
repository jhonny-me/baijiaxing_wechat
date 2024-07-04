const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const OpenAI = require('openai');
const { generateHtml } = require('./generate_wechat');
const imageGenerators = require('./imageGenerators');
require('dotenv').config();

const surnames = [
    '赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', 
    '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许', 
    '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏', 
    '陶', '姜', '戚', '谢', '邹', '喻', '柏', '水', '窦', '章', 
    '云', '苏', '潘', '葛', '奚', '范', '彭', '郎', '鲁', '韦', 
    '昌', '马', '苗', '凤', '花', '方', '俞', '任', '袁', '柳', 
    '酆', '鲍', '史', '唐', '费', '廉', '岑', '薛', '雷', '贺', 
    '倪', '汤', '滕', '殷', '罗', '毕', '郝', '邬', '安', '常', 
    '乐', '于', '时', '傅', '卞', '齐', '康', '伍', '余', '夏',
    '元', '卜', '顾', '孟', '平', '黄', '和', '穆', '萧', '尹'
];

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

const args = process.argv.slice(2);
const selectedGenerator = args.includes('--imageGenerator') ? args[args.indexOf('--imageGenerator') + 1] : 'first';
const downloadImage = imageGenerators[selectedGenerator];

async function getFourCharacterPhrases(surnames) {
    const prompt = `生成包含每个姓氏或包含谐音姓氏的四字成语，四字成语需要是好的寓意，不能有负能量词语，每个词语都必须是4个字，不能是3个字也不能是5个字。当是谐音成语的时候，需要将谐音字替换为姓氏，请按以下格式输出：
姓氏: 四字词语
例如：
赵: 赵歌燕舞
钱: 饮马投钱
孙: 桂子兰孙
彭: 彭程万里
何：何颜悦色
...\n${surnames.join('\n')}`;
    const data = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: '你是一个生成四字成语的助手, 词语总是四个字。' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
    });

    console.log(data.choices[0].message.content); // 调试信息
    if (data && data.choices && data.choices.length > 0) {
        const lines = data.choices[0].message.content.trim().split('\n');
        return lines.map(line => line.split(': ')[1]);
    } else {
        throw new Error('No choices in response');
    }
}

async function main() {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}`;
    const folderName = `百家姓流量主_${formattedDate}`;
    const folderPath = path.join(__dirname, folderName);

    await fs.ensureDir(folderPath);

    const selectedSurnames = surnames.sort(() => 0.5 - Math.random()).slice(0, 30);
    const phrases = await getFourCharacterPhrases(selectedSurnames);

    for (let i = 0; i < selectedSurnames.length; i++) {
        const surname = selectedSurnames[i];
        const phrase = phrases[i];
        console.log(`Downloading image for surname ${surname} with phrase ${phrase}`);
        await downloadImage(surname, phrase, folderPath);
    }

    // 调用生成HTML的函数
    await generateHtml(folderPath);
}

main().catch(console.error);
