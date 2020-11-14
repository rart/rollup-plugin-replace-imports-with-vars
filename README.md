# rollup-plugin-replace-imports-with-vars

Say you're using the [dynamic `import()`](https://v8.dev/features/dynamic-import) on your web app to load some other lib file. Your lib project 
has some dependencies that shouldn't be bundled with your code since they are part of the target 
runtime (i.e. the web app provides them via a global var or something similar). If you have `import x from 'y'`,
once the browser loads your bundle, it will attempt to load file `y`, which might not be what you want.
You may want to grab the dependencies from where ever they are on the runtime — like some global var. 
At least that was my case and why I created this plugin.

This plugin transforms code *more or less* like this: 

- `import { x } from 'y'` => `const { x } = y`
- `import x from 'y'` => `const x = y.default ?? y`
- `import x, { z } from 'y'` => `const x = y.default ?? y; const { z } = y`
- `import * as x from 'y'` => `const x = y`

You can tell the plugin whether you want it to use `const`, `let` or `var`. Note it outputs destructuring 
assignment syntax, so if you need to support browsers without that capability, you may need additional transpiling afterwards.

## Sample

```js
// Original
import { createElement } from 'react';
import { makeStyles, createStyles, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import jss from 'jss';

// ... 
```

```js
// rollup.config.js

const globals = {
  'react': 'window.libs.React',
  'react-dom': 'window.libs.ReactDOM',
  '@material-ui/core': 'window.libs.MaterialUI'
}

export default {
  input: ...,
  output: ...,
  plugins: [
    ...
    replace({ varType: 'var', replacementLookup: globals }),
    ...
  ]
}
```

```js
// transformed
var { createElement } = window.libs.React;
var { makeStyles, createStyles, Typography } = window.libs.MaterialUI;
var { useIntl } = window.libs.ReactIntl;
var jss = window.libs.jss && Object.prototype.hasOwnProperty.call(window.libs.jss, 'default') ? window.libs.jss['default'] : window.libs.jss;

// ...
```
