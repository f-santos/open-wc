const webpack = require('webpack');
const path = require('path');
const rimraf = require('rimraf');
const { expect } = require('chai');
const config = require('../demo/legacy-multi-index/webpack.config');

const outDir = path.join(__dirname, '../dist');
const indexOutputEn =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style><link rel="preload" href="app-en-GB.89873362515bd9e8d15c.js" as="script"></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script>console.log("hello inline script");</script><script src="polyfills/core-js.js" nomodule=""></script><script>!function(){function n(n){return new Promise(function(e,o){var t=document.createElement("script");t.onerror=function(){o(new Error("Error loading "+n))},t.onload=function(){e()},t.src=n,t.setAttribute("defer",!0),document.head.appendChild(t)})}var e="noModule"in HTMLScriptElement.prototype?["app-en-GB.89873362515bd9e8d15c.js"]:["legacy/app-en-GB.193043272a0470f5fcf6.js"],o=[];"attachShadow"in Element.prototype&&"getRootNode"in Element.prototype||o.push(n("polyfills/webcomponents.js")),o.length?Promise.all(o).then(function(){e.forEach(function(e){n(e)})}):e.forEach(function(e){n(e)})}();</script></body></html>';
const indexOutputNl =
  '<html lang="nl-NL"><head><title>My app</title><style>my-app{display:block}</style><link rel="preload" href="app-nl-NL.703423f758660cbe6270.js" as="script"></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script>console.log("hello inline script");</script><script src="polyfills/core-js.js" nomodule=""></script><script>!function(){function n(n){return new Promise(function(e,o){var t=document.createElement("script");t.onerror=function(){o(new Error("Error loading "+n))},t.onload=function(){e()},t.src=n,t.setAttribute("defer",!0),document.head.appendChild(t)})}var e="noModule"in HTMLScriptElement.prototype?["app-nl-NL.703423f758660cbe6270.js"]:["legacy/app-nl-NL.a19d5ba15b0cd9f7b1c1.js"],o=[];"attachShadow"in Element.prototype&&"getRootNode"in Element.prototype||o.push(n("polyfills/webcomponents.js")),o.length?Promise.all(o).then(function(){e.forEach(function(e){n(e)})}):e.forEach(function(e){n(e)})}();</script></body></html>';
const indexOutputFr =
  '<html lang="fr-FR"><head><title>My app</title><style>my-app{display:block}</style><link rel="preload" href="app-fr-FR.b4f1cd97b45fe879bb5f.js" as="script"></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script>console.log("hello inline script");</script><script src="polyfills/core-js.js" nomodule=""></script><script>!function(){function e(e){return new Promise(function(n,o){var t=document.createElement("script");t.onerror=function(){o(new Error("Error loading "+e))},t.onload=function(){n()},t.src=e,t.setAttribute("defer",!0),document.head.appendChild(t)})}var n="noModule"in HTMLScriptElement.prototype?["app-fr-FR.b4f1cd97b45fe879bb5f.js"]:["legacy/app-fr-FR.0ad0e89ffae963405fac.js"],o=[];"attachShadow"in Element.prototype&&"getRootNode"in Element.prototype||o.push(e("polyfills/webcomponents.js")),o.length?Promise.all(o).then(function(){n.forEach(function(n){e(n)})}):n.forEach(function(n){e(n)})}();</script></body></html>';
const indexOutputFallback =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style><link rel="preload" href="app-en-GB.89873362515bd9e8d15c.js" as="script"></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script>console.log("hello inline script");</script><script src="polyfills/core-js.js" nomodule=""></script><script>!function(){function n(n){return new Promise(function(e,o){var t=document.createElement("script");t.onerror=function(){o(new Error("Error loading "+n))},t.onload=function(){e()},t.src=n,t.setAttribute("defer",!0),document.head.appendChild(t)})}var e="noModule"in HTMLScriptElement.prototype?["app-en-GB.89873362515bd9e8d15c.js"]:["legacy/app-en-GB.193043272a0470f5fcf6.js"],o=[];"attachShadow"in Element.prototype&&"getRootNode"in Element.prototype||o.push(n("polyfills/webcomponents.js")),o.length?Promise.all(o).then(function(){e.forEach(function(e){n(e)})}):e.forEach(function(e){n(e)})}();</script></body></html>';
const indexOutputDemo =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style><link rel="preload" href="app-en-GB.89873362515bd9e8d15c.js" as="script"></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script>console.log("hello inline script");</script><script src="polyfills/core-js.js" nomodule=""></script><script>!function(){function n(n){return new Promise(function(e,o){var t=document.createElement("script");t.onerror=function(){o(new Error("Error loading "+n))},t.onload=function(){e()},t.src=n,t.setAttribute("defer",!0),document.head.appendChild(t)})}var e="noModule"in HTMLScriptElement.prototype?["app-en-GB.89873362515bd9e8d15c.js"]:["legacy/app-en-GB.193043272a0470f5fcf6.js"],o=[];"attachShadow"in Element.prototype&&"getRootNode"in Element.prototype||o.push(n("polyfills/webcomponents.js")),o.length?Promise.all(o).then(function(){e.forEach(function(e){n(e)})}):e.forEach(function(e){n(e)})}();</script></body></html>';

describe('legacy multi index', function legacyMultiIndex() {
  this.timeout(1000 * 60);

  beforeEach(() => {
    rimraf.sync(outDir);
  });

  it('works for a multi index application with legacy build', done => {
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

      expect(assetKeys.length).to.equal(13);
      expect(legacyAssetKeys.length).to.equal(4);

      expect(assetKeys).to.include('index.html');
      expect(assetKeys).to.include('index-demo.html');
      expect(assetKeys).to.include('index-en-GB.html');
      expect(assetKeys).to.include('index-nl-NL.html');
      expect(assetKeys).to.include('index-fr-FR.html');
      expect(legacyAssetKeys).to.not.include('index.html');
      expect(legacyAssetKeys).to.not.include('index-demo.html');
      expect(legacyAssetKeys).to.not.include('index-en-GB.html');
      expect(legacyAssetKeys).to.not.include('index-nl-NL.html');
      expect(legacyAssetKeys).to.not.include('index-fr-FR.html');

      expect(assetKeys).to.include('polyfills/core-js.js');
      expect(assetKeys).to.include('polyfills/core-js.js.map');
      expect(assetKeys).to.include('polyfills/webcomponents.js');
      expect(assetKeys).to.include('polyfills/webcomponents.js.map');
      expect(legacyAssetKeys).to.not.include('polyfills/core-js.js');
      expect(legacyAssetKeys).to.not.include('polyfills/core-js.js.map');
      expect(legacyAssetKeys).to.not.include('polyfills/webcomponents.js');
      expect(legacyAssetKeys).to.not.include('polyfills/webcomponents.js.map');

      expect(
        assetKeys.filter(key => key.startsWith('app-en-GB') && key.endsWith('.js')).length,
      ).to.equal(1);
      expect(
        assetKeys.filter(key => key.startsWith('app-nl-NL') && key.endsWith('.js')).length,
      ).to.equal(1);
      expect(
        assetKeys.filter(key => key.startsWith('app-fr-FR') && key.endsWith('.js')).length,
      ).to.equal(1);
      expect(
        legacyAssetKeys.filter(key => key.startsWith('legacy/app-en-GB') && key.endsWith('.js'))
          .length,
      ).to.equal(1);
      expect(
        legacyAssetKeys.filter(key => key.startsWith('legacy/app-nl-NL') && key.endsWith('.js'))
          .length,
      ).to.equal(1);
      expect(
        legacyAssetKeys.filter(key => key.startsWith('legacy/app-fr-FR') && key.endsWith('.js'))
          .length,
      ).to.equal(1);

      expect(assetKeys.filter(key => key.startsWith('3') && key.endsWith('.js')).length).to.equal(
        1,
      );
      expect(
        legacyAssetKeys.filter(key => key.startsWith('legacy/3') && key.endsWith('.js')).length,
      ).to.equal(1);

      expect(assets['index-en-GB.html'].source()).to.equal(indexOutputEn);
      expect(assets['index-nl-NL.html'].source()).to.equal(indexOutputNl);
      expect(assets['index-fr-FR.html'].source()).to.equal(indexOutputFr);
      expect(assets['index.html'].source()).to.equal(indexOutputFallback);
      expect(assets['index-demo.html'].source()).to.equal(indexOutputDemo);

      done();
    });
  });
});
