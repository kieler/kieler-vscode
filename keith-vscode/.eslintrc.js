module.exports = {
    env: {
        node: true,
        es2021: true,
    },
    extends: ['airbnb-base', 'prettier', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 13,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint', 'prettier', 'import'],
    rules: {
        'prettier/prettier': 2, // Means error
        'import/extensions': [0, 'never'],
        'no-plusplus': 0,
        'import/prefer-default-export': 0,
        'no-useless-constructor': 0,
        'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
        'max-classes-per-file': 0,
        'no-use-before-define': 0,
        'no-underscore-dangle': 0,
        'no-nested-ternary': 0,
        'no-param-reassign': 0,
        'class-methods-use-this': 0,
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
        'import/core-modules': ['vscode'],
    },
}
