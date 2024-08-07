//@ts-check

"use strict";

const webpack = require("webpack");

const path = require("path");

/**@type {import('webpack').Configuration}*/
const config = {
    target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
    mode: "none", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')


    entry: path.resolve(__dirname, "src/extension.ts"), // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: {
        // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, "dist"),
        filename: "extension.js",
        libraryTarget: "commonjs2"
    },
    devtool: "nosources-source-map",
    externals: {
        vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    resolve: {
        // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        extensions: [".tsx", ".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
};

/**@type {import('webpack').Configuration}*/
const verificationWebview = {
    target: 'web',
    mode: "none", // Leave source code as close as possible. Only set to production during distribution.


    entry: path.resolve(__dirname, 'src/model-checker/main.ts'),
    output: {
		filename: 'verification-webview.js',
        path: path.resolve(__dirname, "dist"),
    },
    devtool: "nosources-source-map",

    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ['ts-loader']
            },
            {
                test: /\.js$/,
                use: ['source-map-loader'],
                enforce: 'pre'
            },
            {
                test: /\.css$/,
                exclude: /\.useable\.css$/,
                use: ['style-loader', 'css-loader']
            },
        ]
    }
};

/**@type {import('webpack').Configuration}*/
const simulationWebview = {
    target: 'web',
    mode: "none", // Leave source code as close as possible. Only set to production during distribution.


    entry: path.resolve(__dirname, 'src/simulation/main.ts'),
    output: {
		filename: 'simulation-webview.js',
        path: path.resolve(__dirname, "dist"),
    },
    devtool: 'nosources-source-map',

    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ['ts-loader']
            },
            {
                test: /\.js$/,
                use: ['source-map-loader'],
                enforce: 'pre'
            },
            {
                test: /\.css$/,
                exclude: /\.useable\.css$/,
                use: ['style-loader', 'css-loader']
            },
        ]
    }
};

module.exports = [config, verificationWebview, simulationWebview];
