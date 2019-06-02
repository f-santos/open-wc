const loadScriptFunction = `
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
}`;

const loadEntries = 'entries.forEach(function (entry) { loadScript(entry); })';
const entriesLoader = `polyfills.length  ? Promise.all(polyfills).then(function() { ${loadEntries} }) : ${loadEntries};`;

const asArrayLiteral = arr => `[${arr.map(e => `'${e}'`).join(',')}]`;

/**
 *
 * @param {string[]} entries
 * @param {string[]} legacyEntries
 */
function createEntriesVariable(entries, legacyEntries) {
  if (!legacyEntries || !legacyEntries.length) {
    return `var entries = ${asArrayLiteral(entries)}`;
  }

  return `var entries = 'noModule' in HTMLScriptElement.prototype ? ${asArrayLiteral(
    entries,
  )} : ${asArrayLiteral(legacyEntries)};`;
}

/**
 * @param {import('@open-wc/building-utils/index-html/create-index-html').Polyfill[]} polyfills
 */
function createPolyfillsLoader(polyfills) {
  let code = 'var polyfills = [];\n';

  polyfills.forEach(polyfill => {
    if (!polyfill.test) {
      return;
    }

    code += `if (${polyfill.test}) { polyfills.push(loadScript('polyfills/${
      polyfill.name
    }.js')) }\n`;
  });

  return code;
}

/**
 *
 * @param {string[]} entries
 * @param {string[]} legacyEntries
 * @param {import('@open-wc/building-utils/index-html/create-index-html').Polyfill[]} polyfills
 */
function createLoaderScript(entries, legacyEntries, polyfills) {
  /* eslint-disable prefer-template */
  return (
    '(function() {' +
    loadScriptFunction +
    '\n\n' +
    createEntriesVariable(entries, legacyEntries) +
    '\n\n' +
    createPolyfillsLoader(polyfills) +
    '\n' +
    entriesLoader +
    '\n' +
    '})();'
  );
}

module.exports.createLoaderScript = createLoaderScript;
