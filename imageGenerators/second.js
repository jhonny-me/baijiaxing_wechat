const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// http://jiqie.zhenbi.com/3/m57.htm

async function downloadImage(surname, phrase, folderPath) {
    const data = `id=${encodeURIComponent(surname)}&zhenbi=20191123&id1=1097&id2=8092&id3=${encodeURIComponent(phrase)}&id4=709&id5=%23FFFFFF&id6=%230000FF`;
    const url = 'http://jiqie.zhenbi.com/make.php?file=3&page=57';

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Content-type': 'application/x-www-form-urlencoded',
                'Cookie': 'Hm_lvt_d50c3c9cd85f1ae74470bba96564acf9=1719822373,1720102919; HMACCOUNT=EA696F39BA42203C; __gads=ID=752f49c6be000ffc:T=1719822373:RT=1720102923:S=ALNI_MbOFm5DbjLhOjuSR0rmM0vAeTufQQ; __gpi=UID=00000e6d92a59f1d:T=1719822373:RT=1720102923:S=ALNI_MbHSDrWQ_Xswx4nndN9G4G4_jY1pQ; __eoi=ID=d86058a8baeb7f95:T=1719822373:RT=1720102923:S=AA-AfjZfHmanMIygbF8FOAr8ZIgy; Hm_lpvt_d50c3c9cd85f1ae74470bba96564acf9=1720102991',
                'Origin': 'http://jiqie.zhenbi.com',
                'Pragma': 'no-cache',
                'Referer': 'http://jiqie.zhenbi.com/3/m57.htm',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
            }
        });

        const imageUrl = response.data.zhenbi[0].info[0];
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