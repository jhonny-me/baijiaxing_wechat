const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const surnames = [
    '赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', 
    '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许', 
    '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏', 
    '陶', '姜', '戚', '谢', '邹', '喻', '柏', '水', '窦', '章', 
    '云', '苏', '潘', '葛', '奚', '范', '彭', '郎', '鲁', '韦', 
    '昌', '马', '苗', '凤', '花', '方', '俞', '任', '袁', '柳', 
    '酆', '鲍', '史', '唐', '费', '廉', '岑', '薛', '雷', '贺', 
    '倪', '汤', '滕', '殷', '罗', '毕', '郝', '邬', '安', '常', 
    '乐', '于', '时', '傅', '皮', '卞', '齐', '康', '伍', '余', 
    '元', '卜', '顾', '孟', '平', '黄', '和', '穆', '萧', '尹'
];


async function downloadImage(url, filepath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function main() {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}`;
    const folderName = `百家姓流量主_${formattedDate}`;
    const folderPath = path.join(__dirname, folderName);

    await fs.ensureDir(folderPath);

    const selectedSurnames = surnames.sort(() => 0.5 - Math.random()).slice(0, 30);

    for (const surname of selectedSurnames) {
        const data = `id=${encodeURIComponent(surname)}&zhenbi=20191123&id1=2012&id2=8093&id3=${encodeURIComponent('一夜暴富')}&id4=728&id5=%23FFFFFF&id6=%230000FF`;
        const url = 'http://jiqie.zhenbi.com/make.php?file=3&page=73';

        try {
            const response = await axios.post(url, data, {
                headers: {
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Content-type': 'application/x-www-form-urlencoded',
                    'Cookie': 'Hm_lvt_d50c3c9cd85f1ae74470bba96564acf9=1719822373; __gads=ID=752f49c6be000ffc:T=1719822373:RT=1719822373:S=ALNI_MbOFm5DbjLhOjuSR0rmM0vAeTufQQ; __gpi=UID=00000e6d92a59f1d:T=1719822373:RT=1719822373:S=ALNI_MbHSDrWQ_Xswx4nndN9G4G4_jY1pQ; __eoi=ID=d86058a8baeb7f95:T=1719822373:RT=1719822373:S=AA-AfjZfHmanMIygbF8FOAr8ZIgy; Hm_lpvt_d50c3c9cd85f1ae74470bba96564acf9=1719822381',
                    'Origin': 'http://jiqie.zhenbi.com',
                    'Pragma': 'no-cache',
                    'Referer': 'http://jiqie.zhenbi.com/3/m73.htm',
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
                }
            });

            const imageUrl = response.data.zhenbi[0].info[0];
            const filepath = path.join(folderPath, `${surname}.jpg`);
            await downloadImage(imageUrl, filepath);
            console.log(`Downloaded ${surname}_${formattedDate}.jpg`);
        } catch (error) {
            console.error(`Failed to download image for surname ${surname}:`, error);
        }
    }
}

main().catch(console.error);
