const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isDev = process.argv.some(v => v.includes("development"));


module.exports = {
    mode: isDev ? "development" : "production",
    devtool: isDev ? "inline-source-map" : false,
    entry: {
        main: "./src/index.ts"
    },
    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: "index.js"
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            }
        ]
    },
    optimization: {
        minimize: !isDev
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            hash: true,
            inject: 'body'
        })
    ]
};
