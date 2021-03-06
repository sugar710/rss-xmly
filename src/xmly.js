import cheerio from "cheerio";
import axios from "axios";
import md5 from "crypto-js/md5";

export default class RSS {

    async getChannel(url) {
        let { data: content } = await axios.get(url);
        let $ = cheerio.load(content);
        let title = $(".detail h1.title").text();
        let description = $(".detail article.intro").text();
        let image = "https:" + $(".detail img.img").attr("src");
        let author = $(".anchor-info a.nick-name").text();
        let pages = Number(
            $(".pagination .quick-jump .control-input").attr("max") || 1
        );
        let albumId = url.match(/\/(\d+)\/?(p\d+\/?)?$/)[1];

        image = image.substring(0, image.indexOf("!strip"));
        console.log("标题:", title);
        console.log("封面:", image);
        console.log("作者:", author);
        console.log("简介:", description);
        console.log("页数:", pages);
        return {
            albumId,
            title,
            description,
            image,
            author,
            list: [],
            url: url,
            pages,

        };
    };

    /**
     * 获取资源ID
     * 
     * @param {number} id 
     */
    async getAudioPlayUrl(id) {
        let ua =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36";
        let url = `https://www.ximalaya.com/revision/play/v1/audio?id=${id}&ptype=1`;
        let { data: res } = await axios.get(url, {
            headers: {
                "xm-sign": await this.getSign(),
                "user-agent": ua,
            },
        });
        return res.data.src;
    }

    async getAudioInfo(id) {
        let url = `https://www.ximalaya.com/revision/track/simple?trackId=${id}`;
        let {data: res} = await axios.get(url);
        let playUrl = await this.getAudioPlayUrl(id);
        return {
            ...res.data.trackInfo,
            playUrl: playUrl
        }
    }

    /**
     * 获取专辑信息
     * 
     * @param {string} url 
     */
    async getAlbum(url) {
        let channel = await this.getChannel(url);
        for (let i = 1; i <= channel.pages; i++) {
            channel.list = channel.list.concat(await this.getAudioList(channel.albumId, i))
        }
        return channel;
    }

    async getAudioList(albumId, pageNum = 1) {
        console.log(`开始加载专辑 ${albumId} 第 ${pageNum} 页`);
        let url = `https://www.ximalaya.com/revision/album/v1/getTracksList?albumId=${albumId}&pageNum=${pageNum}`
        let { data: res } = await axios.get(url, {
            headers: {
                'xm-sign': await this.getSign(),
            }
        });
        let result = [];
        let list = res.data.tracks;
        for (let i = 0; i < list.length; i++) {
            let info = await this.getAudioInfo(list[i].trackId);
            result.push({
                title: list[i].title,
                url: info.playUrl,
                source: 'https://ximalaya.com' + list[i].url,
                duration: list[i].duration,
                lastUpdate: info.lastUpdate,
                description: info.richIntro.replace(/p><p/g, 'p>\n<p').replace(/<[^>]*>/g, '').replace(/\n/g, '<br/>'),
                cover: 'http:' + info.coverPath
            })
        }
        return result;
    }

    /**
     * 生成签名
     */
    async getSign() {
        let url = `https://www.ximalaya.com/revision/time`;
        let serverTime = await axios.get(url).then(res => res.data);
        return `{himalaya-${serverTime}}(12)${serverTime}(11)${Date.now()}`.replace(
            /{([\w-]+)}/,
            function (t, e) {
                return md5(e);
            }
        );
    }
}