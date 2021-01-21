const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    //entry: './index.js',
    entry: './src/cli.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'rss.js'
    },
    optimization: {
        //minimize: false
    },
    target: 'node',
    externals: [nodeExternals()]
}