const { findSupportedBrowsers } = require('@open-wc/building-utils');
const path = require('path');
const WebpackIndexHTMLPlugin = require('@open-wc/webpack-index-html-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const development = !process.argv.find(arg => arg.includes('production'));
const legacy = process.argv.find(arg => arg.includes('legacy'));

const defaultOptions = {
  indexHTML: './index.html',
};

/* eslint-disable-next-line no-shadow */
function createConfig(options, legacy) {
  if (options.entry) {
    throw new Error(
      `entry in config is deprecated. Use the 'input' field and point it to your index.html`,
    );
  }

  return {
    entry: options.input,

    output: {
      filename: `${legacy ? 'legacy/' : ''}[name].[chunkhash].js`,
      chunkFilename: `${legacy ? 'legacy/' : ''}[name].[chunkhash].js`,
      path: path.resolve(process.cwd(), `dist`),
    },

    devtool: development ? 'inline-source-map' : 'source-map',

    resolve: {
      mainFields: [
        // current leading de-facto standard - see https://github.com/rollup/rollup/wiki/pkg.module
        'module',
        // previous de-facto standard, superceded by `module`, but still in use by some packages
        'jsnext:main',
        // standard package.json fields
        'browser',
        'main',
      ],
    },

    module: {
      rules: [
        {
          test: /\.js$|\.ts$/,
          use: {
            loader: 'babel-loader',

            options: {
              plugins: [
                '@babel/plugin-syntax-dynamic-import',
                '@babel/plugin-syntax-import-meta',
                !development && [
                  'template-html-minifier',
                  {
                    modules: {
                      'lit-html': ['html'],
                      'lit-element': ['html', { name: 'css', encapsulation: 'style' }],
                    },
                    htmlMinifier: {
                      collapseWhitespace: true,
                      removeComments: true,
                      caseSensitive: true,
                      minifyCSS: true,
                    },
                  },
                ],
                // webpack does not support import.meta.url yet, so we rewrite them in babel
                ['bundled-import-meta', { importStyle: 'baseURI' }],
              ].filter(_ => !!_),

              presets: [
                [
                  '@babel/preset-env',
                  // hardcode IE11 for legacy build, otherwise use browserslist configuration
                  { targets: legacy ? 'IE 11' : findSupportedBrowsers() },
                ],
              ],
            },
          },
        },
      ].filter(_ => !!_),
    },

    optimization: {
      minimizer: [
        !development &&
          new TerserPlugin({
            terserOptions: {
              output: {
                comments: false,
              },
            },
            parallel: true,
            sourceMap: true,
          }),
      ].filter(_ => !!_),
    },

    plugins: [
      // @ts-ignore
      !development && new CleanWebpackPlugin(),

      new WebpackIndexHTMLPlugin({
        multiBuild: !development,
        legacy,
        polyfills: {
          coreJs: true,
          webcomponents: true,
          fetch: true,
        },
      }),
    ].filter(_ => !!_),

    devServer: {
      contentBase: process.cwd(),
      compress: true,
      port: 8080,
      historyApiFallback: false,
      stats: {
        stats: 'errors-only',
      },
    },
  };
}

module.exports = userOptions => {
  const options = {
    ...defaultOptions,
    ...userOptions,
  };

  if (development) {
    return createConfig(options, legacy);
  }

  return [createConfig(options, false), createConfig(options, true)];
};
