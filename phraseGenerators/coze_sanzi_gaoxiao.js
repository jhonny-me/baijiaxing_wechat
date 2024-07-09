const axios = require('axios');

const API_URL = 'https://api.coze.cn/v3/chat';
const RETRIEVE_URL = 'https://api.coze.cn/v3/chat/retrieve';
const MESSAGE_LIST_URL = 'https://api.coze.cn/v3/chat/message/list';
const BOT_ID = '7389548904372961291';
const USER_ID = 'johnny';
const API_KEY = process.env.COZE_API_KEY;

async function getThreeCharacterJokes(surnames) {
    const prompt = `生成每个姓氏的三字谐音搞笑语，搞笑语需要是好的寓意，不能有负能量词语，每个词语都必须是3个字，不能是2个字也不能是4个字。当是谐音语的时候，需要将谐音字替换为姓氏，请按以下格式输出：
姓氏: 三字搞笑语
例如：
蒋: 蒋道理
赵: 赵钱孙
钱: 钱多多
孙: 孙儿笑
...\n${surnames.join('\n')}`;

    console.log('Sending initial request to AI service...'); // Debug info
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
        console.log('Checking status...'); // Debug info
        const retrieveResponse = await axios.get(`${RETRIEVE_URL}?chat_id=${chat_id}&conversation_id=${conversation_id}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        status = retrieveResponse.data.data.status;
        console.log('Current status:', status); // Debug info
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
        console.log('Parsed lines:', lines); // Debug info
        return lines.map(line => line.split(': ')[1]);
    } else {
        throw new Error('No answer found in AI response');
    }
}

module.exports = getThreeCharacterJokes;
