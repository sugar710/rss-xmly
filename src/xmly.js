import cheerio from "cheerio";
import axios from "axios";
import md5 from "crypto-js/md5";
import ffmpeg from "fluent-ffmpeg";

export default class RSS {

    async getChannel(url) {
        let { data: content } = await axios.get(url);
        let $ = cheerio.load(content);
        let title = $(".detail h1.title").text();
        let image = "https:" + $(".detail img.img").attr("src");
        let author = $(".anchor-info a.nick-name").text();
        let pages = Number(
            $(".pagination .quick-jump .control-input").attr("max")
        );
        
        let pageList = new Array(pages)
            .fill(null)
            .map((item, index) => `${url}p${index + 1}/`);
        console.log("标题:", title);
        console.log("封面:", image);
        console.log("作者:", author);
        console.log("页数:", pages);
        return {
            title,
            image: image.substring(0, image.indexOf("!strip")),
            author,
            pageList,
            list: [],
            url: url,
        };
    };

    /**
     * 获取资源ID
     * 
     * @param {number} id 
     */
    async audioUrl(id) {
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

    /**
     * 获取资源时长
     * 
     * @param {string} url 
     */
    async audioDuration(url) {
        const format = (time) => {
            let h = (~~(time / 3600)).toString().padStart(2, "0");
            let m = (~~(time / 60)).toString().padStart(2, "0");
            let s = (~~(time % 60)).toString().padStart(2, "0");
            return `${h}:${m}:${s}`;
        };
        return new Promise((resolve) => {
            ffmpeg.ffprobe(url, (err, metadata) => {
                if (err) {
                    return resolve("00:00:00");
                }
                resolve(format(metadata.format.duration));
            });
        });
    }

    /**
     * 获取专辑信息
     * 
     * @param {string} url 
     */
    async getAlbum(url) {
        let channel = await this.getChannel(url);
        channel.list = await this.getAudioList(channel.pageList);
        return channel;
    }

    /**
     * 获取专辑资源列表
     * 
     * @param {array} pageList 
     */
    async getAudioList(pageList) {
        //https://www.ximalaya.com/revision/album/v1/getTracksList?albumId=261506&pageNum=2
        let list = [];
        for (let i = 0; i < pageList.length; i++) {
            console.log(`开始抓取第${i + 1}页`, pageList[i]);
            let data = await this.getAudio(pageList[i]);
            list = list.concat(data);
        }
        return list;
    }

    async getAudio(url) {
        let { data: content } = await axios.get(url);
        let $ = cheerio.load(content);

        let result = [];
        let list = $(".detail .sound-list>ul>li");

        for (let i = 0; i < list.length; i++) {
            let a = $(list[i]).find(".text a");
            let title = $(list[i]).find(".text a").text();
            let aid = $(list[i]).find(".text a").attr("href").split("/").pop();
            let src = await this.audioUrl(aid);
            result.push({
                title: title,
                url: src,
                source: "https://ximalaya.com" + a.attr("href"),
                duration: await this.audioDuration(src),
            });
        }
        return result;
    }

    /**
     * 生成签名
     */
    async getSign() {
        let xmTime = await this.getXMTime();
        return `{himalaya-${xmTime}}(12)${xmTime}(11)${Date.now()}`.replace(
            /{([\w-]+)}/,
            function (t, e) {
                return md5(e);
            }
        );
    }

    /**
     * 获取服务器时间
     */
    async getXMTime() {
        let url = `https://www.ximalaya.com/revision/time`;
        return await axios.get(url).then((res) => res.data);
    }
}