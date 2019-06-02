const webpack = require('webpack');
const path = require('path');
const rimraf = require('rimraf');
const { expect } = require('chai');
const config = require('../demo/legacy/webpack.config');

const outDir = path.join(__dirname, '../dist');
const indexOutput =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style><link rel="preload" href="app.0e67c3c8756c4f927e6c.js" as="script"></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script>console.log("hello inline script");</script><script src="polyfills/core-js.js" nomodule=""></script><script>!function(){function e(e){return new Promise(function(n,o){var t=document.createElement("script");t.onerror=function(){o(new Error("Error loading "+e))},t.onload=function(){n()},t.src=e,t.setAttribute("defer",!0),document.head.appendChild(t)})}var n="noModule"in HTMLScriptElement.prototype?["app.0e67c3c8756c4f927e6c.js"]:["legacy/app.a5e5eace8631c3001feb.js"],o=[];"attachShadow"in Element.prototype&&"getRootNode"in Element.prototype||o.push(e("polyfills/webcomponents.js")),o.length?Promise.all(o).then(function(){n.forEach(function(n){e(n)})}):n.forEach(function(n){e(n)})}();</script></body></html>';

describe('legacy', function legacyEntry() {
  this.timeout(1000 * 60);

  beforeEach(() => {
    rimraf.sync(outDir);
  });

  it('works for a single entry application with legacy build', done => {
    webpack(config, (err, multiStats) => {
      if (err) {
        throw err;
      }

      const stats = multiStats.stats[0];
      const legacyStats = multiStats.stats[1];

      if (stats.hasErrors()) {
        throw stats.compilation.errors[0];
      }

      if (legacyStats.hasErrors()) {
        throw legacyStats.compilation.errors[0];
      }

      const { assets } = stats.compilation;
      const { assets: legacyAssets } = legacyStats.compilation;
      const assetKeys = Object.keys(assets);
      const legacyAssetKeys = Object.keys(legacyAssets);

      assetKeys.forEach(key => {
        expect(assets[key].emitted).to.equal(true);
        expect(assets[key].existsAt).to.ok;
      });

      expect(assetKeys.length).to.equal(7);
      expect(legacyAssetKeys.length).to.equal(2);
      expect(assetKeys).to.include('index.html');
      expect(legacyAssetKeys).to.not.include('index.html');
      expect(assetKeys).to.include('polyfills/core-js.js');
      expect(assetKeys).to.include('polyfills/core-js.js.map');
      expect(assetKeys).to.include('polyfills/webcomponents.js');
      expect(assetKeys).to.include('polyfills/webcomponents.js.map');
      expect(legacyAssetKeys).to.not.include('polyfills/core-js.js');
      expect(legacyAssetKeys).to.not.include('polyfills/core-js.js.map');
      expect(legacyAssetKeys).to.not.include('polyfills/webcomponents.js');
      expect(legacyAssetKeys).to.not.include('polyfills/webcomponents.js.map');
      expect(assetKeys.filter(key => key.startsWith('app') && key.endsWith('.js')).length).to.equal(
        1,
      );
      expect(assetKeys.filter(key => key.startsWith('1') && key.endsWith('.js')).length).to.equal(
        1,
      );
      expect(
        legacyAssetKeys.filter(key => key.startsWith('legacy/app') && key.endsWith('.js')).length,
      ).to.equal(1);
      expect(
        legacyAssetKeys.filter(key => key.startsWith('legacy/1') && key.endsWith('.js')).length,
      ).to.equal(1);

      expect(assets['index.html'].source()).to.equal(indexOutput);

      done();
    });
  });
});
