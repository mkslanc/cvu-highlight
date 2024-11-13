"use strict";
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
    let loader;
        loader = {
            test: /\.(t|j)sx?$/,
            use: {
                loader: 'ts-loader',
                options: {
                    transpileOnly: true
                }
            },
            exclude: /node_modules/,
        }
    return {
        devtool: 'source-map',
        entry: {
            simple: './memri-flutter.ts',
        },
        module: {
            rules: [
                loader,
                {
                    test: /\.(css)$/i,
                    use: [
                        {
                            loader: 'text-loader',
                            options: {
                                name: '[path][name].[ext]',
                            }
                        },
                    ],
                }],
        },
        resolveLoader: {
            modules: [
                "node_modules",
                __dirname + "/node_modules",
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
        output: {
            filename: 'bundle.[name].js',
            path: __dirname + '/dist',
        },
        optimization: {
            minimize: false
        },
        devServer: {
            compress: true,
            port: 9000,
            client: {
                overlay: false
            },
            headers: {
                'Cross-Origin-Embedder-Policy': 'require-corp',
                'Cross-Origin-Opener-Policy': 'same-origin'
            },
        },
        plugins: [
            new CopyPlugin({
                patterns: [
                    { from: "index.html", to: "." },
                ],
            }),
        ],
    }
};