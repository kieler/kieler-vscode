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
