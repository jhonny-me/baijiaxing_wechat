const axios = require('axios');

const API_URL = 'https://api.coze.cn/v3/chat';
const RETRIEVE_URL = 'https://api.coze.cn/v3/chat/retrieve';
const MESSAGE_LIST_URL = 'https://api.coze.cn/v3/chat/message/list';
const BOT_ID = '7389548904372961291';
const USER_ID = 'johnny';
const API_KEY = process.env.COZE_API_KEY;

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

    const createResponse = await axios.post(API_URL, {
        bot_id: BOT_ID,
        user_id: USER_ID,
        stream: false,
        auto_save_history: true,
        additional_messages: [
            {
                role: "user",
                content: prompt,
                content_type: "text"
            }
        ]
    }, {
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    const { id: chat_id, conversation_id } = createResponse.data.data;

    let status = 'in_progress';
    while (status === 'in_progress' || status === 'created') {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
        const retrieveResponse = await axios.get(`${RETRIEVE_URL}?chat_id=${chat_id}&conversation_id=${conversation_id}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        status = retrieveResponse.data.data.status;
        if (status === 'failed' || status === 'requires_action') {
            throw new Error('AI service failed or requires action');
        }
    }

    console.log('Retrieving messages...'); // Debug info
    const messageListResponse = await axios.get(`${MESSAGE_LIST_URL}?chat_id=${chat_id}&conversation_id=${conversation_id}`, {
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    const answerMessage = messageListResponse.data.data.find(message => message.type === 'answer');
    if (answerMessage) {
        const lines = answerMessage.content.trim().split('\n').filter(line => line.trim() !== '');
        return lines.map(line => line.split(': ')[1]);
    } else {
        throw new Error('No answer found in AI response');
    }
}

module.exports = getFourCharacterPhrases;
