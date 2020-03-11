'use strict';

const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('react-dev-utils/ForkTsCheckerWebpackPlugin');
const webpackConfigFactory = require('./webpack.config.js');
const paths = require('./paths');
const path = require('path');
const ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin');
const PnpWebpackPlugin = require('pnp-webpack-plugin');

const main = [
  'core-js',
  'whatwg-fetch',
  './src/index.tsx',
  './src/index.ssr.tsx',
];

function getBaseConfig(webpackEnv) {
  const template = webpackConfigFactory(webpackEnv);

  return {
    ...template,
    context: process.cwd(), // to automatically find tsconfig.json
    entry: {
      main,
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      publicPath: '/',
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin(
        PnpWebpackPlugin.forkTsCheckerOptions({
          tslint: true,
          useTypescriptIncrementalApi: false, // not possible to use this until: https://github.com/microsoft/TypeScript/issues/31056
        })
      ),
      new ForkTsCheckerNotifierWebpackPlugin({
        title: 'TypeScript',
        excludeWarnings: false,
      }),
      new HtmlWebpackPlugin({
        inject: true,
        template: 'src/index.html',
      }),
    ],
    module: {
      rules: [
        {
          test: /.tsx?$/,
          loader: require.resolve('ts-loader'),
          options: PnpWebpackPlugin.tsLoaderOptions({ transpileOnly: true }),
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      plugins: [PnpWebpackPlugin],
    },
    resolveLoader: {
      plugins: [PnpWebpackPlugin.moduleLoader(module)],
    },
    devtool: 'inline-source-map',
    devServer: {
      clientLogLevel: 'warning',
      open: true,
      historyApiFallback: true,
      stats: 'errors-only',
    },
  };
}

// decorate original webpack config
module.exports = function(webpackEnv) {
  const clientConfig = getBaseConfig(webpackEnv);

  return [
    // ssr compiler config
    {
      ...clientConfig,
      name: 'ssr',
      target: 'node',
      entry: [
        // ssr entry point, usually s.th. like `./src/index.ssr.tsx` with `export default (req,res) => {}`
        paths.appIndexSsrJs,
      ],
      optimization: {
        ...clientConfig.optimization,
        // disable chunk splitting
        splitChunks: {},
        runtimeChunk: false,
      },
    },

    // client compiler config
    {
      ...clientConfig,
      name: 'client',
    },
  ];
};
