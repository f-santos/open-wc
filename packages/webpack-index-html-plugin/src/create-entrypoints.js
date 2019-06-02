const path = require('path');
const fs = require('fs');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const { extractResources } = require('@open-wc/building-utils/index-html');

function createEntrypoints(compiler, context, entry, config, createError) {
  let index;

  // entry is an array when running webpack dev server, so we handle it. However we should not encourage/communicate that people can
  // use an array
  if (Array.isArray(entry)) {
    const indices = entry.filter(e => e.endsWith('index.html'));
    if (indices.length === 0) {
      throw createError(
        'Entry must be a string pointing to a index.html file. For multiple entry points add module scripts to your index.html.',
      );
    } else if (indices.length > 1) {
      throw createError('There should be only one index.html entrypoint.');
    } else {
      [index] = indices;

      // register the other entry points
      entry.forEach((e, i) => {
        if (e !== index) {
          // special treatment for dev server
          const entryName = e.includes('webpack-dev-server')
            ? 'webpack-dev-server'
            : `entrypoint-${i}`;
          new SingleEntryPlugin(context, e, entryName).apply(compiler);
        }
      });
    }
  } else if (typeof entry !== 'string') {
    throw createError(
      'Entry must be a string pointing to a index.html file. For multiple entry points add module scripts to your index.html.',
    );
  } else {
    if (!entry.endsWith('index.html')) {
      throw createError('Entry must be a single index.html file');
    }
    index = entry;
  }

  if (!fs.existsSync(index)) {
    throw createError(`Could not find entry file: ${index}`);
  }

  const indexFolder = path.dirname(index);
  const indexHTMLString = fs.readFileSync(index, 'utf-8');
  const resources = extractResources(indexHTMLString);

  if (resources.jsModules.length === 0) {
    throw createError(
      'Could not find any js modules in entry point. Add a <script type="module" src="..."> to your index.html',
    );
  }

  const entries = resources.jsModules.map(jsModule => ({
    jsModule: path.resolve(indexFolder, jsModule),
    entryName: jsModule.substring(jsModule.lastIndexOf(path.sep) + 1, jsModule.length - 3),
  }));

  if (new Set(entries.map(e => e.entryName)).size !== entries.length) {
    throw createError('Module filenames imported the index.html should be unique.');
  }

  let entryNamesForVariations = null;
  if (!config.multiIndex) {
    entries.forEach(({ jsModule, entryName }) => {
      new SingleEntryPlugin(context, jsModule, entryName).apply(compiler);
    });
  } else {
    entryNamesForVariations = new Map();

    // we need to create multiple index files, for each entry create a new entry for each variation.
    entries.forEach(({ jsModule, entryName }) => {
      config.multiIndex.variations.forEach(variation => {
        const entrySuffix = variation.sharedEntry || variation.name;
        const variationEntryName = `${entryName}-${entrySuffix}`;

        let entryNamesForVariation = entryNamesForVariations.get(variation.name);
        if (!entryNamesForVariation) {
          entryNamesForVariation = [];
          entryNamesForVariations.set(variation.name, entryNamesForVariation);
        }
        entryNamesForVariation.push(variationEntryName);

        // if this index shares an entry point, no need to create it's own entry point
        if (variation.sharedEntry) {
          return;
        }

        // create an entry point for this variation
        new SingleEntryPlugin(context, jsModule, variationEntryName).apply(compiler);
      });
    });
  }

  return {
    baseIndex: resources.indexHTML,
    entries: entries.map(e => e.entryName),
    entryNamesForVariations,
  };
}

module.exports.createEntrypoints = createEntrypoints;
