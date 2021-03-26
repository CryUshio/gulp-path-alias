import path from 'path';
import through from 'through2';
import replace from 'replacestream';
import slash from 'slash';

type AliasMapType = Record<string, string>;
type Options = {
  cwd?: string;
  paths?: AliasMapType;
};
type AliasListType = Array<{
  aliasKey: string;
  aliasValue: string;
}>;

const prefixPatternMap = {
  js: 'import\\s*[^\'"]*\\(?|from|require\\s*\\(',
  // poster: wxml
  xml: 'src=|url=|poster=|href=',
  css: '@import\\s*|url\\s*\\(',
};
/* 全匹配的正则规则 */
const exactMatchPattern = /\$$/;

type PrefixPatternMap = typeof prefixPatternMap;

/**
 * 编码别名替换项
 * eg. '/' -> '\\/'
 */
function encodeAliasString(alias: string): string {
  return alias.replace('/', '\\/');
}

/* 获取匹配前缀正则字符串 */
function getPrefixPatternString(prefixPatten: string): string {
  return `(?:(${prefixPatten})\\s*['"]?\\s*)`;
}

/* 获取匹配后缀正则字符串 */
function getSuffixPatternString(exactMatch = false): string {
  const suffixPattern = '[\'"]|\\s*\\)';
  // 全匹配时，后面没有内容，拿掉斜线
  return exactMatch ? suffixPattern : `\\/|${suffixPattern}`;
}

/* 获取匹配主体和后缀的正则字符串 */
function getRemainPatternString(aliasKey: string, exactMatch?: boolean): string {
  const _aliasKey = exactMatch ? aliasKey.replace(exactMatchPattern, '') : aliasKey;
  return `(?<alias>${_aliasKey})(${getSuffixPatternString(exactMatch)})`;
}

/* 获取相对路径 */
function relative(from: string, to: string) {
  const relativePath = slash(path.relative(from, to));

  if (!relativePath) {
    return '.';
  }

  return !/^\./.test(relativePath) ? `./${relativePath}` : relativePath;
}

// 100000 rows * 100 columns -> 248ms
function replaceAll(file: any, dirname: string, aliasList: AliasListType) {
  const ext = path.extname(file.relative);
  const isStream = file.isStream();

  /* 根据后缀名获得前缀正则字符串，降低复杂度 */
  let prefixPatternString: string;
  switch (ext) {
    // js
    case '.js':
    case '.ts':
    case '.wxs':
      prefixPatternString = getPrefixPatternString(prefixPatternMap.js);
      break;
    // css
    case '.css':
    case '.less':
    case '.scss':
    case '.sass':
    case '.styl':
    case '.stylus':
    case '.wxss':
      prefixPatternString = getPrefixPatternString(prefixPatternMap.css);
      break;
    // xml
    case '.html':
    case '.wxml':
      prefixPatternString = getPrefixPatternString(prefixPatternMap.xml);
      break;
    case '.jsx':
    case '.tsx':
    default:
      prefixPatternString = getPrefixPatternString(
        Object.keys(prefixPatternMap)
          .map((k) => prefixPatternMap[k as keyof PrefixPatternMap])
          .join('|')
      );
      break;
  }

  aliasList.forEach(({ aliasKey, aliasValue }) => {
    const isExactMatch = exactMatchPattern.test(aliasKey);
    const remainPatternString = getRemainPatternString(aliasKey, isExactMatch);
    const sentenceReg = new RegExp(`${prefixPatternString}${remainPatternString}`, 'gm');

    const replacer = (match: string, ...args: any[]) => {
      const group: Record<string, string> = args.pop();
      const { alias } = group;
      /* 如果替换路径是相对路径不使用 relative 路径替换，而是直接替换 */
      const replaceStr = path.isAbsolute(aliasValue) ? relative(dirname, aliasValue) : aliasValue;
      return match.replace(alias, replaceStr);
    };

    /* 先确定文件中匹配的语句，再替换其中所有匹配的 alias */
    if (isStream) {
      file.contents = file.contents.pipe(replace(sentenceReg, replacer));
    } else {
      file.contents = Buffer.from(String(file.contents).replace(sentenceReg, replacer));
    }
  });

  return file;
}

/**
 * 
 * @param options 
 */
function alias(options: Options = {}) {
  const _options: Required<Options> = {
    cwd: process.cwd(),
    paths: {},
    ...options,
  };

  const { paths } = _options;
  const isEmptyAlias = !Object.keys(paths).length;

  /* 初始化 aliasList，全局使用，避免重复计算 */
  const aliasList: AliasListType = Object.keys(paths)
    /* 全匹配的需要优先替换，放在前面 */
    .sort((a) => (exactMatchPattern.test(a) ? -1 : 1))
    .map((aliasKey) => {
      /* 替换斜线，否则生成 pattern 时会出错 */
      const encodeKey = encodeAliasString(aliasKey);
      return {
        aliasKey: encodeKey,
        aliasValue: paths[aliasKey],
      };
    });

  return through.obj(function (file, _, cb) {
    const dirname = path.dirname(file.path);

    if (file.isNull() || isEmptyAlias) {
      return cb(null, file);
    }

    file = replaceAll(file, dirname, aliasList);

    cb(null, file);
  });
}

export = alias;
