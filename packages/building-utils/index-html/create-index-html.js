const { serialize } = require('parse5');
const Terser = require('terser');
const deepmerge = require('deepmerge');
const htmlMinifier = require('html-minifier');
const { createScript, createElement } = require('../dom5-utils');
const { append, query, predicates } = require('../dom5-fork');
const { getPolyfills } = require('./polyfills');
const { createLoaderScript } = require('./loader-script');

/** @typedef {import('parse5').ASTNode} ASTNode */

/**
 * @typedef {object} Polyfill
 * @property {string} name
 * @property {string} [test]
 * @property {string} code
 * @property {string} sourcemap
 * @property {boolean} [nomodule]
 */

/**
 * @typedef {object} PolyfillInstruction
 * @property {string} name name of the polyfill
 * @property {string} path polyfill path
 * @property {string} [test] expression which should evaluate to true to load the polyfill
 * @property {boolean} [nomodule] whether to inject the polyfills as a script with nomodule attribute
 * @property {string} [sourcemapPath] polyfill sourcemaps path
 * @property {boolean} [noMinify] whether to minify the polyfills. default true if no sourcemap is given, false otherwise
 */

/**
 * @typedef {object} PolyfillsConfig
 * @property {boolean} [coreJs] whether to polyfill core-js polyfills
 * @property {boolean} [webcomponents] whether to polyfill webcomponents
 * @property {boolean} [fetch] whether to polyfill fetch
 * @property {boolean} [intersectionObserver] whether to polyfill intersection observer
 * @property {PolyfillInstruction[]} [customPolyfills] custom polyfills specified by the user
 */

/**
 * @typedef {object} CreateIndexHTMLConfig
 * @property {PolyfillsConfig} polyfills
 * @property {string[]} entries
 * @property {string[]} [legacyEntries]
 * @property {false|object} minify minify configuration, or false to disable minification
 */

/** @type {Partial<CreateIndexHTMLConfig>} */
const defaultConfig = {
  polyfills: {
    coreJs: false,
    webcomponents: false,
    intersectionObserver: false,
    fetch: false,
  },
  minify: {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: code => Terser.minify(code).code,
  },
};

/**
 * Creates script nodes for polyfills and entries which should be loaded on startup. For example
 * core-js polyfills with a 'nomodule' attribute, and the entry point if don't need to inject
 * a loader.
 *
 * @param {Polyfill[]} polyfills
 * @param {string[]} entries
 * @param {boolean} shouldInjectLoader
 * @returns {ASTNode[]}
 */
function createStandaloneScripts(polyfills, entries, shouldInjectLoader) {
  /** @type {ASTNode[]} */
  const scripts = [];

  polyfills.forEach(polyfill => {
    if (polyfill.test) {
      return;
    }

    const args = { src: `polyfills/${polyfill.name}.js` };
    if (polyfill.nomodule) {
      args.nomodule = '';
    }
    scripts.push(createScript(args));
  });

  if (!shouldInjectLoader) {
    entries.forEach(entry => {
      scripts.push(createScript({ src: entry }));
    });
  }

  return scripts;
}

/**
 * Generates a index HTML based on the given configuration. A clean index.html should be
 *
 * @param {ASTNode} baseIndex the base index.html
 * @param {Partial<CreateIndexHTMLConfig>} config
 * @returns {{ indexHTML: string, polyfills: Polyfill[] }} the updated index html
 */
function createIndexHTML(baseIndex, config) {
  const localConfig = deepmerge(defaultConfig, config);
  if (!baseIndex) {
    throw new Error('Missing baseIndex.');
  }

  if (!localConfig.entries || !localConfig.entries.length) {
    throw new Error('Invalid config: missing config.entries');
  }

  const head = query(baseIndex, predicates.hasTagName('head'));
  const body = query(baseIndex, predicates.hasTagName('body'));

  if (!head) {
    throw new Error(`Invalid index.html: missing <head>`);
  }

  if (!body) {
    throw new Error(`Invalid index.html: missing <body>`);
  }

  const polyfills = getPolyfills(localConfig.polyfills);

  // we only need to inject a loader if there are polyfills which require a test or if there are legacy entries
  const shouldInjectLoader =
    !!polyfills.find(p => !!p.test) ||
    (localConfig.legacyEntries && localConfig.legacyEntries.length > 0);

  const standaloneScripts = createStandaloneScripts(
    polyfills,
    localConfig.entries,
    shouldInjectLoader,
  );
  standaloneScripts.forEach(script => {
    append(body, script);
  });

  if (shouldInjectLoader) {
    const preloadLinks = localConfig.entries.map(entry =>
      createElement('link', { rel: 'preload', href: entry, as: 'script' }),
    );
    const loaderScriptCode = createLoaderScript(
      localConfig.entries,
      localConfig.legacyEntries,
      polyfills,
    );
    const loaderScript = createScript(null, loaderScriptCode);

    preloadLinks.forEach(link => {
      append(head, link);
    });

    append(body, loaderScript);
  }

  const serialized = serialize(baseIndex);
  const result = localConfig.minify
    ? htmlMinifier.minify(serialized, localConfig.minify)
    : serialized;

  return {
    indexHTML: result,
    polyfills,
  };
}
module.exports.createIndexHTML = createIndexHTML;
