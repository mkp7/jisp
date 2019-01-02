let envStack = [{
  number: /^(\s*)(-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?)(\)|\s)/
}]

const evalScheme = function (code, env) {
  let match = envStack[0].number.exec(code)
  if (match === null) return 'not number\n'
  return '' + parseFloat(match[2]) + '\nrem:' + code.slice(match[1].length + match[2].length)
}

module.exports = evalScheme
