import path from 'path';
import fs from 'fs';
import commander from 'commander';
import RSS from './xmly';
import { buildXml, saveXml, dirExists } from './utils';

const app = new commander.Command();
app
    .option('-u, --url <url>', '指定喜马拉雅专辑地址')
    .option('-o, --output <file>', '保存文件名如:rss.xml')
    .action(async ({ url, output }) => {
        // 验证URL为喜马拉雅网址 & 验证output为合法文件名
        if (!url || url.indexOf('www.ximalaya.com') === -1) {
            return console.log('请使用 -u 配置喜马拉雅地址')
        }
        if (!output) {
            let match = url.match(/\/(\d+)\/?(p\d+\/?)?$/);
            if (!match) {
                return console.log('请使用 -o 配置输出文件');
            }
            output = match[1] + '.xml';
        }
        let folder = path.dirname(path.resolve(output));
        
        if (! await dirExists(folder)) {
            //return console.log('文件夹:' + folder + '不存在!');
            fs.mkdirSync(folder, {recursive: true, mode: "755"});
        }

        let rss = new RSS();
        let channel = await rss.getAlbum(url);
        let xml = buildXml(channel);
        saveXml(xml, output);
        console.log(channel.title + ' RSS生成成功');
        console.log('文件位于:', path.resolve(output));
    });
app.version('1.0.0', '-v, --version', '查看版本');
app.parse(process.argv);

export default app;
