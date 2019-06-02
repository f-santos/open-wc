/* eslint-disable class-methods-use-this, no-param-reassign */
const path = require('path');
const deepmerge = require('deepmerge');
const { createEntrypoints } = require('./src/create-entrypoints');
const { getLegacyEntries } = require('./src/get-legacy-entries');
const { emitIndexHTML } = require('./src/emit-index-html');
/**
 * @typedef {object} VariationConfig
 * @property {string} name the name of this variation
 * @property {string} [sharedEntry] if an entry should be shared, this variation
 *   will not create a new entrypoint but share it with another variation
 */

/**
 * @typedef {object} MultiIndexConfig
 * @property {string} [fallback]
 * @property {VariationConfig[]} variations
 * @property {(index: string, variation: string, fallback: boolean) => string} [transformIndex]
 */

/**
 * @typedef {object} WebpackIndexHTMLPluginConfig
 * @property {(data: object) => string} template
 * @property {MultiIndexConfig} [multiIndex]
 * @property {boolean} [legacy]
 * @property {boolean} [multiBuild]
 * @property {string} [legacyDir]
 * @property {number} [legacyTimeout]
 * @property {import('@open-wc/building-utils/index-html/create-index-html').PolyfillsConfig} [polyfills]
 * @property {false|object} [minify] minify configuration, or false to disable minification
 */

const PLUGIN = 'WebpackIndexHTMLPlugin';
const defaultConfig = {
  legacyDir: 'legacy',
  legacyTimeout: 1000 * 60 * 10,
};
const createError = msg => new Error(`[${PLUGIN}]: ${msg}`);

class WebpackIndexHTMLPlugin {
  /**
   * @param {Partial<WebpackIndexHTMLPluginConfig>} config
   */
  constructor(config = {}) {
    this._config = deepmerge(defaultConfig, config);

    if (config.multiIndex) {
      if (!Array.isArray(config.multiIndex.variations)) {
        throw createError('Missing an array of variations at multiIndex.variations.');
      }

      if (config.multiIndex.variations.some(v => !v.name)) {
        throw createError(`Some variations are missing a name property.`);
      }
    }
  }

  apply(compiler) {
    /** @type {string[] | null} */
    let entries = null;
    /** @type {Map<string, string[]> | null} */
    let entryNamesForVariations = null;
    let baseIndex;

    if (!this._config.template) {
      compiler.hooks.entryOption.tap(PLUGIN, (context, entry) => {
        const result = createEntrypoints(compiler, context, entry, this._config, createError);
        ({ baseIndex, entries, entryNamesForVariations } = result);
        return false;
      });

      if (this._config.legacy) {
        return;
      }
    }

    compiler.hooks.emit.tapPromise(PLUGIN, async compilation => {
      const outputPath = path.join(compilation.outputOptions.path, this._config.legacyDir);
      const timeout = this._config.legacyTimeout;

      let legacyEntries;
      if (this._config.multiBuild) {
        try {
          legacyEntries = await getLegacyEntries(
            timeout,
            outputPath,
            entries,
            entryNamesForVariations,
          );
        } catch (error) {
          throw createError(error.message);
        }
      }

      emitIndexHTML(compilation, this._config, baseIndex, entryNamesForVariations, legacyEntries);
    });
  }
}

module.exports = WebpackIndexHTMLPlugin;
