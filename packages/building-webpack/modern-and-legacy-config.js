const { findSupportedBrowsers } = require('@open-wc/building-utils');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ModernWebWebpackPlugin = require('./modern-web-webpack-plugin');

const development = !process.argv.find(arg => arg.includes('production'));
const legacy = process.argv.find(arg => arg.includes('legacy'));

const prefix = '[@open-wc/building-webpack/modern-and-legacy-config]:';
const { queryAll, predicates, getAttribute } = require('./dom5-fork/index.js');
const { readHTML } = require('./src/utils.js');

const modernWebWebpackPlugin = new ModernWebWebpackPlugin({ development });

const defaultOptions = {
  indexHTML: './index.html',
  entry: './index.js',
  htmlEntryPoint: false,
};

/* eslint-disable-next-line no-shadow */
function createConfig(options, legacy) {
  return {
    entry: Array.isArray(options.entry) ? options.entry : [options.entry],

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
        options.htmlEntryPoint && {
          test: options.input,
          loader: require.resolve('./src/clean-up-html-loader.js'),
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

      new HtmlWebpackPlugin({
        template: options.indexHTML,
        inject: false,
      }),

      modernWebWebpackPlugin,
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

  if (typeof options.input === 'string' && options.input.endsWith('index.html')) {
    options.indexHTML = options.input;
    options.htmlEntryPoint = true;
    const indexHTML = readHTML(options.input);
    const scripts = queryAll(indexHTML, predicates.hasTagName('script'));
    const moduleScripts = scripts.filter(script => getAttribute(script, 'type') === 'module');

    if (moduleScripts.length === 0) {
      throw new Error(
        `${prefix} Could not find any module script in configured input: ${options.input}`,
      );
    }

    if (moduleScripts.some(script => !getAttribute(script, 'src'))) {
      throw new Error(`${prefix} Module scripts without a 'src' attribute are not supported.`);
    }
    const indexDir = path.dirname(options.input);

    const modules = moduleScripts.map(script => getAttribute(script, 'src'));
    options.entry = modules.map(p => path.join(indexDir, p));
  }

  if (development) {
    return createConfig(options, legacy);
  }

  return [createConfig(options, false), createConfig(options, true)];
};
