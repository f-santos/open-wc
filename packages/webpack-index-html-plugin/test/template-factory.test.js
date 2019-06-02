const webpack = require('webpack');
const path = require('path');
const rimraf = require('rimraf');
const { expect } = require('chai');
const config = require('../demo/template-factory/webpack.config');

const outDir = path.join(__dirname, '../dist');
const indexOutput =
  '<html><head><link rel="preload" href="main.0e67c3c8756c4f927e6c.js" as="script"></head><body><p>Template factory</p><script type="module" src="main.0e67c3c8756c4f927e6c.js"></script><script src="main.0e67c3c8756c4f927e6c.js"></script></body></html>';

describe('template-factory', function templateFacotory() {
  this.timeout(1000 * 60);

  beforeEach(() => {
    rimraf.sync(outDir);
  });

  it('works for a config with a template factory', done => {
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

      expect(assetKeys.length).to.equal(3);
      expect(assetKeys).to.include('index.html');
      expect(
        assetKeys.filter(key => key.startsWith('main') && key.endsWith('.js')).length,
      ).to.equal(1);
      expect(assetKeys.filter(key => key.startsWith('1') && key.endsWith('.js')).length).to.equal(
        1,
      );

      expect(assets['index.html'].source()).to.equal(indexOutput);

      done();
    });
  });
});
