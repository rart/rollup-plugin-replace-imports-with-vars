import { Plugin } from 'rollup';

export interface ReplaceImportsOptions {
  /**
   * Instructs the plugin the type of variable declaration to use
   * @default const
   **/
  varType?: 'const' | 'let' | 'var';
  /**
   * Instructs the plugin what javascript var or namespace to place
   * as the right side of the declaration statement. For example,
   * { '@material-ui/core': 'window.MaterialUI' }
   * @default {}
   * */
  replacementLookup: Record<string, string>;
  /**
   * Same as replacementLookup but with regular expressions. The key should be a string that will
   * be passed to RegExp constructor to check against the `from` part of the import statement. The
   * value should be a function that's called when there's a match and should return the
   * global/namespace where to initialize the import from.
   * @default {}
   * */
  replacementRegExps: Record<string, (match: RegExpExecArray) => string>;
  /**
   * TODO:
   *  This doesn't really work well unless the dependency is reported in external or globals in rollup.
   *  At that point, can't extract the targets only. Need different approach. Possibly a different rollup lifecycle hook.
   * { '@redux/toolkit': { targets: ['createAction'], source: 'window.ReduxToolkit' } }
   * */
  // specificNamedExports: Record<string, { targets: string[], source: string }>;
}

const toRegExp: (str: string) => RegExp = (str: string) => {
  try {
    return new RegExp(str);
  } catch {
    return null;
  }
};

const AllAsXRegExp = /\*\s+as\s+([\w$]*)/g;

export default function replaceImports(options: ReplaceImportsOptions): Plugin {
  const {
    varType = 'const',
    replacementLookup = {},
    replacementRegExps = {}
  } = options;
  const specificNamedExports = {};
  const regExpsKeys = Object.keys(replacementRegExps);
  const regExps: Array<RegExp> = regExpsKeys.map(toRegExp).filter(Boolean);
  return {
    name: 'rollup-plugin-replace-imports-with-vars',
    renderChunk(code) {
      return code.replace(/import\s+([\w$*\s{},]*)\s+from\s+('.*?'|".*?")/g, function (
        match,
        imports,
        fromUri,
        offset,
        string
      ) {
        let fromName = fromUri.replace(/['"]/g, '');
        let source = replacementLookup[fromName];
        let regExp: RegExp;
        if (!source) {
          let index = regExps.findIndex((regExp) => regExp.test(fromName));
          regExp = regExps[index];
          if (regExp?.test(fromName)) {
            source = replacementRegExps[regExpsKeys[index]](regExp.exec(fromName));
          }
        }
        if (source) {
          const trimmedImports = imports.trim();
          const pieces = [];
          const allAsX = trimmedImports.match(AllAsXRegExp);
          const namedExports = trimmedImports.match(/{.*?}/g);
          const defaultExports = trimmedImports.replace(/({.*?})|(?:\*\s+as\s+([\w$]*))|[,\s]/g, '');
          if (allAsX) {
            allAsX.forEach((chunk) => pieces.push(`${varType} ${AllAsXRegExp.exec(chunk)[1]} = ${source}`));
          }
          if (namedExports) {
            namedExports.forEach(
              (chunk) =>
                pieces.push(`${varType} ${chunk.replace(/([a-zA-Z0-9$_]+) as ([a-zA-Z0-9$_]+)/g, '$1: $2')} = ${source}`)
            );
          }
          if (defaultExports) {
            pieces.push(
              `${varType} ${defaultExports} = ${source} && Object.prototype.hasOwnProperty.call(${source}, 'default') ? ${source}['default'] : ${source}`
            );
          }
          if (pieces.length) {
            return pieces.join(';\n');
          } else {
            return string;
          }
        } /*else if (specificNamedExports[fromName]) {
          const data = specificNamedExports[fromName];
          const trimmedImports = imports.trim();
          const namedExports = trimmedImports.match(/{(.+)}/);
          if (namedExports) {
            const pieces = [];
            const matches = [];
            const remaining = [];
            namedExports[1].trim().split(',').forEach((namedExport) => {
              if (data.targets.includes(namedExport)) {
                matches.push(namedExport.replace(/([a-zA-Z0-9$_]+)\s+as\s+([a-zA-Z0-9$_]+)/, '$1: $2'))
              } else {
                remaining.push(namedExport);
              }
            });
            if (matches.length) {
              pieces.push(`${varType} { ${matches.join(',')} } = ${data.source}`)
              if (remaining.length) {
                pieces.push(`import { ${remaining.join(',')} } from ${fromUri}`)
              }
              return pieces.join(';\n');
            } else {
              return string;
            }
          } else {
            return string
          }
        }*/ else {
          return match;
        }
      });
    }
  };
}
