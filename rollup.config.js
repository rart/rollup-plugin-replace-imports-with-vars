import pkg from './package.json';
import typescript from 'rollup-plugin-typescript2';
import prettier from 'rollup-plugin-prettier';

export default {
  input: './src/index.ts',
  output: [
    { file: pkg.main, format: 'cjs', exports: 'auto' },
    { file: pkg.module, format: 'es' }
  ],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.json',
      outDir: './dist'
    }),
    prettier({
      tabWidth: 2,
      singleQuote: true,
      printWidth: 100,
      parser: 'babel'
    })
  ]
};
