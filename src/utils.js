import fs from "fs";

/**
 * 简易生成 RSS XML内容
 * @param {Object} channel 
 */
export const buildXml = (channel) => {
    let list = channel.list.map((item) => {
        return `
                <item>
                    <title><![CDATA[${item.title}]]></title>
                    <link><![CDATA[${item.source}]]></link>
                    <pubDate>${item.lastUpdate}</pubDate>
                    <description><![CDATA[${item.description}]]></description>
                    <itunes:image href="${item.cover}"/>
                    <enclosure url="${item.url}" type="audio/mpeg"/>
                    <itunes:duration>${durationFormat(item.duration)}</itunes:duration>
                </item>
            `;
    });

    return `
        <rss 
            xmlns:atom="http://www.w3.org/2005/Atom"
            xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
            versiion="2.0"
            encoding="UTF-8">
            <channel>
                <title><![CDATA[${channel.title}]]></title>
                <link>${channel.url}</link>
                <pubDate>${new Date()}</pubDate>
                <description><![CDATA[${channel.description}]]></description>
                <generator>冯二毅</generator>
                <language>zh-CN</language>
                <itunes:author>${channel.author}</itunes:author>
                <itunes:image href="${channel.image}"/>
                <itunes:owner>
                    <itunes:name>冯二毅</itunes:name>
                    <itunes:email>hxtgirq710@gmail.com</itunes:email>
                </itunes:owner>
                ${list.join("")}
            </channel>
        </rss>
        `;
}

/**
 * 保存XML内容到文件
 * 
 * @param {stirng} xml 
 * @param {string} file 
 */
export const saveXml = (xml, file) => {
    return fs.writeFileSync(file, xml);
}

export const dirExists = (dir) => {
    return new Promise((resolve) => {
        fs.exists(dir, valid => resolve(valid));
    })
}

export const durationFormat = time => {
    let h = (~~(time / 3600)).toString().padStart(2, "0");
    let m = (~~(time / 60)).toString().padStart(2, "0");
    let s = (~~(time % 60)).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
}