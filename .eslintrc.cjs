/* eslint-env node */
module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  globals: {
    google: true,
  },
  
  // parser: 'typescript-eslint-parser',
  //   plugins: [
  //       'typescript'
  //   ],
  //   rules: {
  //       // @fixable 必須使用 === 或 !==，禁止使用 == 或 !=，與 null 比較時除外
  //       'eqeqeq': [
  //           'error',
  //           'always',
  //           {
  //               null: 'ignore'
  //           }
  //       ],
  //       // 類別和介面的命名必須遵守帕斯卡命名法，比如 PersianCat
  //       'typescript/class-name-casing': 'error'
  //   }
}
