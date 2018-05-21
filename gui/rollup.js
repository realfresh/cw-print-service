import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'gui/src/main/index.js',
  output: {
    file: 'gui/dist/index.js',
    format: 'cjs'
  },
  watch: {
    exclude: ['node_modules/**', "tmp/**", "gui/dist/**"],
  },
  plugins: [
    resolve({
      preferBuiltins: false,
      jsnext: true,
      main: true
    }),
    commonjs({
      include: 'node_modules/**',  // Default: undefined
    }),
    babel({
      plugins: ['external-helpers']
    })
  ]
};