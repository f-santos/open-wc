# Webpack Index HTML Plugin

[//]: # (AUTO INSERT HEADER PREPUBLISH)

Webpack plugin for building modern standards based web applications.

The primary intention of this plugin is being able to use webpack without needing to make any changes to your source code.

1. Takes a standard index.html:
```html
<html lang="en-GB">
  <head>
    <title>My app</title>
    <style>
      my-app {
        display: block;
      }
    </style>
  </head>

  <body>
    <h1>
      <span>
        Hello world!
      </span>
    </h1>
    <my-app></my-app>

    <script>
      (function () {
        var message = 'hello inline script';
        console.log(message);
      })();
    </script>

    <script type="module" src="./app.js"></script>
  </body>
</html>
```

2. Extracts any `<script type="module">` and feeds it to webpack as entry point

3. Outputs the same index.html with updated file hashes and all inline HTML, CSS and JS minified:
```html
<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script>console.log("hello inline script");</script><script src="app.202933f045cc9f6cdf51.js"></script></body></html>
```

## Input
This plugin works with the same index.html that works during development with a simple web server. Note that only module scripts with a `src` attribute are fed to webpack. Inline module scripts are minified and left as is.

## Usage
To use this plugin, add it to your webpack configuration and set your entry point to resolve to your index.html:

```js
const path = require('path');
const WebpackIndexHTMLPlugin = require('@open-wc/webpack-index-html-plugin');

module.exports = {
  entry: path.resolve(__dirname, './index.html'),

  output: {
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js',
  },

  plugins: [
    new WebpackIndexHTMLPlugin(),
  ],
};
```

## Configuration

### Polyfills
Depending on your browser support, you will often need to polyfill browser features. You can enable polyfills in the configuration.

When enabling polyfills a small loader script is injected to your index.html. Polyfills are loaded based on feature detection. This causes a delay in loading your app, which is mediated by adding a preload link.

To enable polyfills:
```js
new WebpackIndexHTMLPlugin({
  polyfills: {
    coreJs: true,
    webcomponents: true,
    fetch: true,
    intersectionObserver: true,
  }
})
```

`core-js` polyfills many language features such as `Promise`, `Symbol` and `String.prototype.includes`. This is added only to browsers which don't support modules, such as IE11.

The other polyfills polyfill specific browser features. See their documentation for more info:
- [core-js](https://github.com/zloirock/core-js)
- [webcomponents](https://github.com/webcomponents/webcomponentsjs)
- [fetch](https://github.com/github/fetch)
- [intersection-observer](https://github.com/w3c/IntersectionObserver)

If you need a polyfill which is not on this list, consider creating an issue so that we can add it. You can also specify custom polyfills:
```js
new WebpackIndexHTMLPlugin({
  polyfills: {
    coreJs: true,
    customPolyfills: [
      {
        // the name of your polyfill
        name: 'my-feature',
        // expression which should evaluate to true if the polyfill should be loaded
        test: "'myFeature' in window",
        // path to your polyfill
        path: require.resolve('my-feature/dist/bundled.js'),
        // path to the sourcemaps of your polyfill. optional
        sourcemapPath: require.resolve('my-feature/dist/bundled.js.map'),
      },
    ],
  },
})
```

### Multi (legacy and modern) build
This plugin supports a legacy and modern build of your app. A loader will be injected which loads the appropriate version of your app, based on whether the browser supports es modules.

This way you can ship a version of your app with less compilation and polyfills to modern browsers, and a compatible version of your app to legacy browsers.

To create multiple webpack builds, export an array of webpack configs instead of a single config. Set the `multiBuild` option in both instances of the plugin and set `legacy` option in the legacy build:

```javascript
const path = require('path');
const WebpackIndexHTMLPlugin = require('@open-wc/webpack-index-html-plugin');

module.exports = [
  {
    entry: path.resolve(__dirname, './index.html'),
    plugins: [
      new WebpackIndexHTMLPlugin({
        multiBuild: true,
        polyfills: {
          coreJs: true,
          webcomponents: true,
        }
      }),
    ],
  },

  {
    entry: path.resolve(__dirname, './index.html'),
    plugins: [
      new WebpackIndexHTMLPlugin({
        multiBuild: true,
        legacy: true,
      }),
    ],
  },
];
```

For the legacy build you do not need to configure any polyfills.

### Minification
We use [html-minifier](https://github.com/kangax/html-minifier) for minifcation with a default configuration. You can adjust this configuration by passing a minify object:
```js
new WebpackIndexHTMLPlugin({
  minify: {
    // minify options
  }
})
```

The options object is passed as is to `html-minifier`. See the documentation of [html-minifier](https://github.com/kangax/html-minifier) for all possible minification options.

It is also possible to turn off minification completely by passing minify:
```js
new WebpackIndexHTMLPlugin({
  minify: false
})
```
