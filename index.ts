import path from "path";
import through from "through2";
import replace from "replacestream";

type AliasMapType = Record<string, string>;
type Options = {
  cwd?: string;
  paths?: AliasMapType;
};
type GetRegExpReturn = (name: string) => RegExp;

const prefixPattenMap = {
  js: `import\\s*[^'"]*\\(?|from|require\\s*\\(`,
  // poster: wxml
  xml: `src=|url=|poster=|href=`,
  css: `@import\\s*|url\\s*\\(`
};

type PrefixPattenMap = typeof prefixPattenMap;

const suffixPatten = `\\/|['"]|\\s*\\)`;

function getRegExp(prefixPatten: string): GetRegExpReturn {
  return function (aliasName) {
    return new RegExp(`(?:(${prefixPatten})\\s*['"]?\\s*)${aliasName}(${suffixPatten})`, "gm");
  };
}

function relative(from: string, to: string) {
  const relativePath = path.relative(from, to);

  if (!relativePath) {
    return ".";
  }

  return !/^\./.test(relativePath) ? `./${relativePath}` : relativePath;
}

// 100000 rows * 100 columns -> 248ms
function replaceAll(file: any, dirname: string, aliasMap: AliasMapType) {
  const ext = path.extname(file.relative);
  const isStream = file.isStream();

  let reg: GetRegExpReturn;
  switch (ext) {
    // js
    case ".js":
    case ".ts":
    case ".wxs":
      reg = getRegExp(prefixPattenMap.js);
      break;
    // css
    case ".css":
    case ".less":
    case ".scss":
    case ".styl":
    case ".stylus":
    case ".wxss":
      reg = getRegExp(prefixPattenMap.css);
      break;
    // xml
    case ".html":
    case ".wxml":
      reg = getRegExp(prefixPattenMap.xml);
      break;
    case ".jsx":
    case ".tsx":
    default:
      reg = getRegExp(
        Object.keys(prefixPattenMap)
          .map((k) => prefixPattenMap[k as keyof PrefixPattenMap])
          .join("|")
      );
      break;
  }

  Object.keys(aliasMap).forEach((alias) => {
    const regExp = reg(alias);
    const subReg = new RegExp(`${alias}(${suffixPatten})`);
    const replacer = `${relative(dirname, aliasMap[alias])}$1`;

    if (isStream) {
      file.contents = file.contents.pipe(replace(regExp, (match) => match.replace(subReg, replacer)));
    } else {
      file.contents = Buffer.from(String(file.contents).replace(regExp, (match) => match.replace(subReg, replacer)));
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

function alias (options: Options = {}) {
  const _options: Required<Options> = {
    cwd: process.cwd(),
    paths: {},
    ...options,
  };

  const { paths } = _options;
  const emptyAlias = !Object.keys(paths).length;

  return through.obj(function (file, _, cb) {
    const dirname = path.dirname(file.path);

    if (file.isNull() || emptyAlias) {
      return cb(null, file);
    }

    file = replaceAll(file, dirname, paths);

    cb(null, file);
  });
}

export = alias;
