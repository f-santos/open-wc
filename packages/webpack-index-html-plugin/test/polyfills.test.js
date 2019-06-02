const webpack = require('webpack');
const path = require('path');
const rimraf = require('rimraf');
const { expect } = require('chai');
const config = require('../demo/polyfills/webpack.config');

const outDir = path.join(__dirname, '../dist');
const indexOutput =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style><link rel="preload" href="app.0e67c3c8756c4f927e6c.js" as="script"></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script>console.log("hello inline script");</script><script src="polyfills/core-js.js" nomodule=""></script><script>!function(){function n(n){return new Promise(function(e,o){var t=document.createElement("script");t.onerror=function(){o(new Error("Error loading "+n))},t.onload=function(){e()},t.src=n,t.setAttribute("defer",!0),document.head.appendChild(t)})}var e=["app.0e67c3c8756c4f927e6c.js"],o=[];"attachShadow"in Element.prototype&&"getRootNode"in Element.prototype||o.push(n("polyfills/webcomponents.js")),o.length?Promise.all(o).then(function(){e.forEach(function(e){n(e)})}):e.forEach(function(e){n(e)})}();</script></body></html>';

describe('polyfills', function singlEntry() {
  this.timeout(1000 * 60);

  beforeEach(() => {
    rimraf.sync(outDir);
  });

  it('works for a single entry application with polyfills', done => {
    webpack(config, (err, stats) => {
      if (err) {
        throw err;
      }

      if (stats.hasErrors()) {
        throw stats.compilation.errors[0];
      }

      const { assets } = stats.compilation;
      const assetKeys = Object.keys(assets);

      assetKeys.forEach(key => {
        expect(assets[key].emitted).to.equal(true);
        expect(assets[key].existsAt).to.ok;
      });

      expect(assetKeys.length).to.equal(7);
      expect(assetKeys).to.include('index.html');
      expect(assetKeys).to.include('polyfills/core-js.js');
      expect(assetKeys).to.include('polyfills/core-js.js.map');
      expect(assetKeys).to.include('polyfills/webcomponents.js');
      expect(assetKeys).to.include('polyfills/webcomponents.js.map');
      expect(assetKeys.filter(key => key.startsWith('app') && key.endsWith('.js')).length).to.equal(
        1,
      );
      expect(assetKeys.filter(key => key.startsWith('1') && key.endsWith('.js')).length).to.equal(
        1,
      );

      expect(assets['index.html'].source()).to.equal(indexOutput);

      done();
    });
  });
});
