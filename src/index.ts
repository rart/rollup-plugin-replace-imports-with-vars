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
  replacementLookup: {
    [key: string]: string;
  }
}

export default function replaceImports(options: ReplaceImportsOptions): Plugin {
  const { varType = 'const', replacementLookup = {} } = options;
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
        const fromName = fromUri.replace(/['"]/g, '');
        if (replacementLookup[fromName]) {
          const source = replacementLookup[fromName];
          const trimmedImports = imports.trim();
          const pieces = [];
          const allAsX = trimmedImports.match(/\*\s+as\s+([\w$]*)/g);
          const individualExports = trimmedImports.match(/{.*?}/g);
          const rest = trimmedImports.replace(/({.*?})|(?:\*\s+as\s+([\w$]*))|[,\s]/g, '');
          if (allAsX) {
            pieces.push(`${varType} ${allAsX} = ${source}`);
          }
          if (individualExports) {
            pieces.push(`${varType} ${individualExports} = ${source}`);
          }
          if (rest) {
            pieces.push(
              `${varType} ${rest} = ${source} && Object.prototype.hasOwnProperty.call(${source}, 'default') ? ${source}['default'] : ${source}`
            );
          }
          if (pieces.length) {
            return pieces.join(';');
          } else {
            return string;
          }
        } else {
          return match;
        }
      });
    }
  };
}
