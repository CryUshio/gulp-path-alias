const path = require('path');
const through = require('through2');
const replace = require('replacestream');

const prefixPattenMap = {
  js: `import\\s*[^'"]*\\(?|from|require\\s*\\(`,
  // poster: wxml
  xml: `src=|url=|poster=`,
  css: `@import\\s*|url\\s*\\(`
};


function getRegExp(prefixPatten) {
  return function (aliasName) {
    return new RegExp(`(?:(${prefixPatten})\\s*['"]?\\s*)${aliasName}(\\/[^'";=)]*|['"]|\\s*\\))`, 'gm');
  }
}

function relative(from, to) {
  const relativePath = path.relative(from, to);

  if (!relativePath) {
    return '.';
  }

  return !/^\./.test(relativePath) ? `./${relativePath}` : relativePath;
}

// 100000 rows * 100 columns -> 248ms
function replaceAll(file, dirname, aliasMap) {
  const ext = path.extname(file.relative); 
  const isStream = file.isStream();

  let reg;
  switch (ext) {
    // js
    case '.js':
    case '.ts':
    case '.wxs':
      reg = getRegExp(prefixPattenMap.js);
      break;
    // css
    case '.css':
    case '.less':
    case '.scss':
    case '.styl':
    case '.stylus':
    case '.wxss':
      reg = getRegExp(prefixPattenMap.css);
      break;
    // xml
    case '.html':
    case '.wxml':
      reg = getRegExp(prefixPattenMap.xml);
      break;
    case '.jsx':
    case '.tsx':
    default:
      reg = getRegExp(Object.keys(prefixPattenMap).map((k) => prefixPattenMap[k]).join('|'));
      break;
  }

  Object.keys(aliasMap).forEach((alias) => {
    const regExp = reg(alias);
    const replacer = relative(dirname, aliasMap[alias]);

    if (isStream) {
      file.contents = file.contents.pipe(replace(regExp, (match) => match.replace(alias, replacer)));
    } else {
      file.contents = Buffer.from(String(file.contents).replace(regExp, (match) => match.replace(alias, replacer)));
    }
  });

  return file;
}

/**
 * 100000 rows * 100 columns -> 324ms
 * 
function replaceAll(file, pathname, aliasMap) {
  const isStream = file.isStream();
  const aliasList = Object.keys(aliasMap);
  const aliasMatch = `(${aliasList.join('|')})`;
  const reg = getRegExp(aliasMatch);

  function replaceOne(match) {
    return match.replace(new RegExp(aliasMatch), (m) => relative(pathname, aliasMap[m]));
  }

  if (isStream) {
    file.contents = file.contents.pipe(replace(reg, replaceOne));
  } else {
    file.contents = Buffer.from(String(file.contents).replace(reg, replaceOne));
  }

  return file;
}
*/

module.exports = function (options = {}) {
  options = {
    cwd: process.cwd(),
    paths: {},
    ...options,
  };

  const { paths } = options;
  const emptyAlias = !Object.keys(paths).length;

  return through.obj(function (file, _, cb) {
    const dirname = path.dirname(file.path);

    if (file.isNull() || emptyAlias) {
      return cb(null, file);
    }

    file = replaceAll(file, dirname, paths);

    cb(null, file);
  });
};
