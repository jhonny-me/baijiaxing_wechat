const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

async function downloadImage(surname, phrase, folderPath) {
    const data = `id=${encodeURIComponent(surname)}&zhenbi=20191123&id1=2006&id2=8042&id3=${encodeURIComponent(phrase)}&id4=710&id5=%23FFFFFF&id6=%230000FF`;
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

        const imageUrl = response.data.info[0];
        const filepath = path.join(folderPath, `${surname}.jpg`);
        const imageResponse = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filepath);
            imageResponse.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Failed to download image for surname ${surname}:`, error);
    }
}

module.exports = downloadImage;
