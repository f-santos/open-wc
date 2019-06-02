const webpack = require('webpack');
const path = require('path');
const rimraf = require('rimraf');
const { expect } = require('chai');
const config = require('../demo/multi-index/webpack.config');

const outDir = path.join(__dirname, '../dist');
const indexOutputEn =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script src="app-en-GB.89873362515bd9e8d15c.js"></script></body></html>';
const indexOutputNl =
  '<html lang="nl-NL"><head><title>My app</title><style>my-app{display:block}</style></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script src="app-nl-NL.703423f758660cbe6270.js"></script></body></html>';
const indexOutputFr =
  '<html lang="fr-FR"><head><title>My app</title><style>my-app{display:block}</style></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script src="app-fr-FR.b4f1cd97b45fe879bb5f.js"></script></body></html>';
const indexOutputFallback =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script src="app-en-GB.89873362515bd9e8d15c.js"></script></body></html>';
const indexOutputDemo =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script src="app-en-GB.89873362515bd9e8d15c.js"></script></body></html>';

describe('multi-index', function multiIndex() {
  this.timeout(1000 * 60);

  beforeEach(() => {
    rimraf.sync(outDir);
  });

  it('works for a multi index application', done => {
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

      expect(assetKeys.length).to.equal(9);
      expect(assetKeys).to.include('index.html');
      expect(assetKeys).to.include('index-demo.html');
      expect(assetKeys).to.include('index-en-GB.html');
      expect(assetKeys).to.include('index-nl-NL.html');
      expect(assetKeys).to.include('index-fr-FR.html');
      expect(
        assetKeys.filter(key => key.startsWith('app-en-GB') && key.endsWith('.js')).length,
      ).to.equal(1);
      expect(
        assetKeys.filter(key => key.startsWith('app-nl-NL') && key.endsWith('.js')).length,
      ).to.equal(1);
      expect(
        assetKeys.filter(key => key.startsWith('app-fr-FR') && key.endsWith('.js')).length,
      ).to.equal(1);
      expect(assetKeys.filter(key => key.startsWith('3') && key.endsWith('.js')).length).to.equal(
        1,
      );

      expect(assets['index-en-GB.html'].source()).to.equal(indexOutputEn);
      expect(assets['index-nl-NL.html'].source()).to.equal(indexOutputNl);
      expect(assets['index-fr-FR.html'].source()).to.equal(indexOutputFr);
      expect(assets['index.html'].source()).to.equal(indexOutputFallback);
      expect(assets['index-demo.html'].source()).to.equal(indexOutputDemo);

      done();
    });
  });
});
