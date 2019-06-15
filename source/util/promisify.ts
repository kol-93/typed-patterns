export function getPromisifyCustomSymbol(): symbol | undefined {
  if (typeof require === 'function') {
    try {
      const value = require('util').promisify.custom;
      if (typeof value === 'symbol') {
        return value;
      }
    } catch (e) {}
  }
  return;
}
