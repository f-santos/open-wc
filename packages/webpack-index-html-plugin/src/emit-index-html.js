/* eslint-disable class-methods-use-this, no-param-reassign */
const path = require('path');
const { serialize, parse } = require('parse5');
const { createIndexHTML } = require('@open-wc/building-utils/index-html');

const VARIATION_FALLBACK = Symbol('fallback');

/**
 * Emits index.html and the associated polyfills.
 */
function emitIndexHTML(
  compilation,
  config,
  baseIndex,
  entryNamesForVariations,
  legacyEntriesResult,
) {
  const allEntries = [];
  compilation.entrypoints.forEach(entrypoint => {
    const jsFiles = entrypoint.getRuntimeChunk().files.filter(f => f.endsWith('.js'));
    allEntries.push(...jsFiles);
  });

  /**
   * @param {string} [filename]
   * @param {string[]} [entries]
   * @param {string | Symbol} [variation]
   */
  const generateIndex = (filename, entries, legacyEntries, variation) => {
    let templateString;
    if (typeof config.template === 'function') {
      templateString = config.template({
        assets: compilation.assets,
        entries,
        legacyEntries,
        variation,
      });
    } else if (typeof config.template === 'string') {
      templateString = config.template;
    }

    const localBaseIndex = templateString ? parse(templateString) : parse(serialize(baseIndex));

    const generateResult = createIndexHTML(localBaseIndex, {
      ...config,
      entries,
      legacyEntries,
    });

    let { indexHTML } = generateResult;
    if (config.multiIndex && config.multiIndex.transformIndex) {
      indexHTML = config.multiIndex.transformIndex(
        indexHTML,
        variation.toString(),
        variation === VARIATION_FALLBACK,
      );
    }

    compilation.assets[filename] = {
      source: () => indexHTML,
      size: () => indexHTML.length,
    };

    generateResult.polyfills.forEach(polyfill => {
      compilation.assets[path.join('polyfills', `${polyfill.name}.js`)] = {
        source: () => polyfill.code,
        size: () => polyfill.code.length,
      };

      if (polyfill.sourcemap) {
        compilation.assets[path.join('polyfills', `${polyfill.name}.js.map`)] = {
          source: () => polyfill.sourcemap,
          size: () => polyfill.sourcemap.length,
        };
      }
    });
  };

  if (!entryNamesForVariations) {
    const legacyEntries = legacyEntriesResult && legacyEntriesResult.entries;
    generateIndex('index.html', allEntries, legacyEntries);
  } else {
    entryNamesForVariations.forEach((entryNamesForVariation, variation) => {
      const entriesForVariation = allEntries.filter(e1 =>
        entryNamesForVariation.some(e2 => e1.startsWith(e2)),
      );
      const legacyEntries =
        legacyEntriesResult && legacyEntriesResult.entryNamesForVariations.get(variation);
      generateIndex(`index-${variation}.html`, entriesForVariation, legacyEntries, variation);
    });

    if (config.multiIndex.fallback) {
      const entryNamesForVariation = entryNamesForVariations.get(config.multiIndex.fallback);
      const entriesForVariation = allEntries.filter(e1 =>
        entryNamesForVariation.some(e2 => e1.startsWith(e2)),
      );
      const legacyEntries =
        legacyEntriesResult &&
        legacyEntriesResult.entryNamesForVariations.get(config.multiIndex.fallback);
      generateIndex('index.html', entriesForVariation, legacyEntries, VARIATION_FALLBACK);
    }
  }
}

module.exports.emitIndexHTML = emitIndexHTML;
