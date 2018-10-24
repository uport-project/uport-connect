module.exports = {
  extends: 'eslint-config-uport',
  globals: {
    FormData: false,
    Blob: false,
    XMLHttpRequest: false
  },
  rules: {
    'standard/no-callback-literal': 0
  }
}