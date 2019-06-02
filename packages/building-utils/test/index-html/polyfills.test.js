const path = require('path');
const { expect } = require('chai');
const { getPolyfills } = require('../../index-html/polyfills');

describe('polyfills', () => {
  it('returns the correct polyfills', () => {
    const config = {
      coreJs: true,
      webcomponents: true,
      fetch: true,
      intersectionObserver: true,
    };

    const polyfills = getPolyfills(config);
    const polyfillsWithoutCode = polyfills.map(p => ({
      ...p,
      code: undefined,
      sourcemap: undefined,
    }));

    expect(polyfillsWithoutCode).to.eql([
      {
        code: undefined,
        name: 'core-js',
        nomodule: true,
        sourcemap: undefined,
        test: undefined,
      },
      {
        code: undefined,
        name: 'fetch',
        nomodule: false,
        sourcemap: undefined,
        test: "!('fetch' in window)",
      },
      {
        code: undefined,
        name: 'intersection-observer',
        nomodule: false,
        sourcemap: undefined,
        test:
          "!('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype)",
      },
      {
        code: undefined,
        name: 'webcomponents',
        nomodule: false,
        sourcemap: undefined,
        test: "!('attachShadow' in Element.prototype) || !('getRootNode' in Element.prototype)",
      },
    ]);

    polyfills.forEach(polyfill => {
      expect(polyfill.code).to.exist;
      expect(polyfill.sourcemap).to.exist;
    });
  });

  it('can turn off some polyfills', () => {
    const config = {
      coreJs: true,
      webcomponents: false,
      fetch: false,
      intersectionObserver: false,
    };

    const polyfills = getPolyfills(config);
    const polyfillsWithoutCode = polyfills.map(p => ({
      ...p,
      code: undefined,
      sourcemap: undefined,
    }));

    expect(polyfillsWithoutCode).to.eql([
      {
        code: undefined,
        name: 'core-js',
        nomodule: true,
        sourcemap: undefined,
        test: undefined,
      },
    ]);

    polyfills.forEach(polyfill => {
      expect(polyfill.code).to.exist;
      expect(polyfill.sourcemap).to.exist;
    });
  });

  it('can load custom polyfills', () => {
    const customPolyfills = [
      {
        name: 'polyfill-a',
        test: "'foo' in window",
        path: path.resolve(__dirname, '../custom-polyfills/polyfill-a.js'),
      },
      {
        name: 'polyfill-b',
        nomodule: true,
        path: path.resolve(__dirname, '../custom-polyfills/polyfill-b.js'),
        sourcemapPath: path.resolve(__dirname, '../custom-polyfills/polyfill-b.js.map'),
      },
    ];
    const config = {
      coreJs: true,
      webcomponents: false,
      fetch: false,
      intersectionObserver: false,
      customPolyfills,
    };

    const polyfills = getPolyfills(config);
    const polyfillsWithoutCode = polyfills.map(p => ({
      ...p,
      code: undefined,
      sourcemap: undefined,
    }));

    expect(polyfillsWithoutCode).to.eql([
      {
        code: undefined,
        name: 'polyfill-a',
        nomodule: false,
        sourcemap: undefined,
        test: "'foo' in window",
      },
      {
        code: undefined,
        name: 'polyfill-b',
        nomodule: true,
        sourcemap: undefined,
        test: undefined,
      },
      {
        code: undefined,
        name: 'core-js',
        nomodule: true,
        sourcemap: undefined,
        test: undefined,
      },
    ]);

    polyfills.forEach(polyfill => {
      expect(polyfill.code).to.exist;
      expect(polyfill.sourcemap).to.exist;
    });
  });
});
