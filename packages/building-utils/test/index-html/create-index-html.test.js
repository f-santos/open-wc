const { expect } = require('chai');
const { parse } = require('parse5');
const path = require('path');
const { createIndexHTML } = require('../../index-html');

const input = `
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
</body>

</html>
`;
const outputDefault =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script src="app.js"></script></body></html>';
const outputCoreJs =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script src="polyfills/core-js.js" nomodule=""></script><script src="app.js"></script></body></html>';
const outputMultiple =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style><link rel="preload" href="app.js" as="script"></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script src="polyfills/core-js.js" nomodule=""></script><script>!function(){function n(n){return new Promise(function(e,t){var o=document.createElement("script");o.onerror=function(){t(new Error("Error loading "+n))},o.onload=function(){e()},o.src=n,o.setAttribute("defer",!0),document.head.appendChild(o)})}var e=["app.js"],t=[];"fetch"in window||t.push(n("polyfills/fetch.js")),"IntersectionObserver"in window&&"IntersectionObserverEntry"in window&&"intersectionRatio"in window.IntersectionObserverEntry.prototype||t.push(n("polyfills/intersection-observer.js")),"attachShadow"in Element.prototype&&"getRootNode"in Element.prototype||t.push(n("polyfills/webcomponents.js")),t.length?Promise.all(t).then(function(){e.forEach(function(e){n(e)})}):e.forEach(function(e){n(e)})}();</script></body></html>';
const outputCustom =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style><link rel="preload" href="app.js" as="script"></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script src="polyfills/custom-b.js" nomodule=""></script><script>!function(){function o(o){return new Promise(function(n,t){var e=document.createElement("script");e.onerror=function(){t(new Error("Error loading "+o))},e.onload=function(){n()},e.src=o,e.setAttribute("defer",!0),document.head.appendChild(e)})}var n=["app.js"],t=[];"foo"in window&&t.push(o("polyfills/custom-a.js")),"attachShadow"in Element.prototype&&"getRootNode"in Element.prototype||t.push(o("polyfills/webcomponents.js")),t.length?Promise.all(t).then(function(){n.forEach(function(n){o(n)})}):n.forEach(function(n){o(n)})}();</script></body></html>';
const outputLegacy =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style><link rel="preload" href="app.js" as="script"></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script>!function(){function n(n){return new Promise(function(e,o){var r=document.createElement("script");r.onerror=function(){o(new Error("Error loading "+n))},r.onload=function(){e()},r.src=n,r.setAttribute("defer",!0),document.head.appendChild(r)})}var e="noModule"in HTMLScriptElement.prototype?["app.js"]:["legacy-app.js","legacy-shared.js"],o=[];o.length?Promise.all(o).then(function(){e.forEach(function(e){n(e)})}):e.forEach(function(e){n(e)})}();</script></body></html>';
const outputLegacyAndPolyfills =
  '<html lang="en-GB"><head><title>My app</title><style>my-app{display:block}</style><link rel="preload" href="app.js" as="script"></head><body><h1><span>Hello world!</span></h1><my-app></my-app><script src="polyfills/core-js.js" nomodule=""></script><script>!function(){function n(n){return new Promise(function(e,o){var t=document.createElement("script");t.onerror=function(){o(new Error("Error loading "+n))},t.onload=function(){e()},t.src=n,t.setAttribute("defer",!0),document.head.appendChild(t)})}var e="noModule"in HTMLScriptElement.prototype?["app.js"]:["legacy-app.js","legacy-shared.js"],o=[];"fetch"in window||o.push(n("polyfills/fetch.js")),o.length?Promise.all(o).then(function(){e.forEach(function(e){n(e)})}):e.forEach(function(e){n(e)})}();</script></body></html>';

describe('generate-index-html', () => {
  it('generates a index.html based on default configuration', () => {
    const config = {
      indexHTML: input,
      entries: ['app.js'],
    };

    const ast = parse(input);
    const result = createIndexHTML(ast, config);
    expect(result.indexHTML).to.equal(outputDefault);
  });

  it('generates a index.html with only core-js polyfills', () => {
    const config = {
      indexHTML: input,
      entries: ['app.js'],
      polyfills: {
        coreJs: true,
      },
    };

    const ast = parse(input);
    const result = createIndexHTML(ast, config);
    expect(result.indexHTML).to.equal(outputCoreJs);
  });

  it('generates a index.html with multiple polyfills', () => {
    const config = {
      indexHTML: input,
      entries: ['app.js'],
      polyfills: {
        coreJs: true,
        fetch: true,
        webcomponents: true,
        intersectionObserver: true,
      },
    };

    const ast = parse(input);
    const result = createIndexHTML(ast, config);
    expect(result.indexHTML).to.equal(outputMultiple);
  });

  it('generates a index.html with custom polyfills', () => {
    const config = {
      indexHTML: input,
      entries: ['app.js'],
      polyfills: {
        webcomponents: true,
        customPolyfills: [
          {
            name: 'custom-a',
            test: "'foo' in window",
            path: path.resolve(__dirname, '../custom-polyfills/polyfill-a.js'),
          },
          {
            name: 'custom-b',
            nomodule: true,
            path: path.resolve(__dirname, '../custom-polyfills/polyfill-b.js'),
          },
        ],
      },
    };

    const ast = parse(input);
    const result = createIndexHTML(ast, config);
    expect(result.indexHTML).to.equal(outputCustom);
  });

  it('generates a index.html with a legacy entry', () => {
    const config = {
      indexHTML: input,
      entries: ['app.js'],
      legacyEntries: ['legacy-app.js', 'legacy-shared.js'],
    };

    const ast = parse(input);
    const result = createIndexHTML(ast, config);
    expect(result.indexHTML).to.equal(outputLegacy);
  });

  it('generates a index.html with a legacy entry and polyfills', () => {
    const config = {
      indexHTML: input,
      entries: ['app.js'],
      legacyEntries: ['legacy-app.js', 'legacy-shared.js'],
      polyfills: {
        coreJs: true,
        fetch: true,
      },
    };

    const ast = parse(input);
    const result = createIndexHTML(ast, config);
    expect(result.indexHTML).to.equal(outputLegacyAndPolyfills);
  });
});
