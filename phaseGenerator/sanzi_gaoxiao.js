const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

async function getThreeCharacterJokes(surnames) {
    const prompt = `生成每个姓氏的三字谐音搞笑语，搞笑语需要是好的寓意，不能有负能量词语，每个词语都必须是3个字，不能是2个字也不能是4个字。当是谐音语的时候，需要将谐音字替换为姓氏，请按以下格式输出：
姓氏: 三字搞笑语
例如：
蒋: 蒋道理
赵: 吉星赵
钱: 钱似锦
孙: 孙如意
...\n${surnames.join('\n')}`;
    const data = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: '你是一个生成三字搞笑语的助手, 词语总是三个字。' },
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

module.exports = getThreeCharacterJokes;
