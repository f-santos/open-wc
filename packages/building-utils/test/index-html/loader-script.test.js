const { expect } = require('chai');
const { createLoaderScript } = require('../../index-html/loader-script');

const polyfills = [
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
];

describe('loader-script', () => {
  it('generates a loader script without legacy entries', () => {
    const entries = ['app.js', 'shared.js'];
    const script = createLoaderScript(entries, null, polyfills);

    expect(script).to.eql(
      `(function() {
function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.onerror = function() {
      reject(new Error('Error loading ' + src));
    };
    script.onload = function() {
      resolve();
    };
    script.src = src;
    script.setAttribute('defer', true);
    document.head.appendChild(script);
  });
}

var entries = ['app.js','shared.js']

var polyfills = [];
if (!('fetch' in window)) { polyfills.push(loadScript('polyfills/fetch.js')) }
if (!('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype)) { polyfills.push(loadScript('polyfills/intersection-observer.js')) }
if (!('attachShadow' in Element.prototype) || !('getRootNode' in Element.prototype)) { polyfills.push(loadScript('polyfills/webcomponents.js')) }

polyfills.length  ? Promise.all(polyfills).then(function() { entries.forEach(function (entry) { loadScript(entry); }) }) : entries.forEach(function (entry) { loadScript(entry); });
})();`,
    );
  });

  it('generates a loader script with legacy entries', () => {
    const entries = ['app.js', 'shared.js'];
    const legacyEntries = ['legacy/app.js', 'legacy/shared.js'];
    const script = createLoaderScript(entries, legacyEntries, polyfills);

    expect(script).to.eql(
      `(function() {
function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.onerror = function() {
      reject(new Error('Error loading ' + src));
    };
    script.onload = function() {
      resolve();
    };
    script.src = src;
    script.setAttribute('defer', true);
    document.head.appendChild(script);
  });
}

var entries = 'noModule' in HTMLScriptElement.prototype ? ['app.js','shared.js'] : ['legacy/app.js','legacy/shared.js'];

var polyfills = [];
if (!('fetch' in window)) { polyfills.push(loadScript('polyfills/fetch.js')) }
if (!('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype)) { polyfills.push(loadScript('polyfills/intersection-observer.js')) }
if (!('attachShadow' in Element.prototype) || !('getRootNode' in Element.prototype)) { polyfills.push(loadScript('polyfills/webcomponents.js')) }

polyfills.length  ? Promise.all(polyfills).then(function() { entries.forEach(function (entry) { loadScript(entry); }) }) : entries.forEach(function (entry) { loadScript(entry); });
})();`,
    );
  });
});
