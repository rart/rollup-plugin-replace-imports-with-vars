import pkg from './package.json';
import typescript from 'rollup-plugin-typescript2';

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
    })
  ]
};
