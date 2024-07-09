const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

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
        const lines = data.choices[0].message.content.trim().split('\n').filter(line => line.trim() !== '');
        return lines.map(line => line.split(': ')[1]);
    } else {
        throw new Error('No choices in response');
    }
}

module.exports = getFourCharacterPhrases;
