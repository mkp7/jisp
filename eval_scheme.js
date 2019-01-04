let envStack = [{
  '+': (...nums) => (nums.length === 0 ? 0 : nums.reduce((a, b) => a + b)),
  '-': (...nums) => (nums.length === 0 ? 0 : nums.reduce((a, b) => a - b)),
  '*': (...nums) => (nums.length === 0 ? 1 : nums.reduce((a, b) => a * b)),
  '/': (...nums) => (nums.length === 0 ? 0 : nums.reduce((a, b) => a / b))
}]

// return [data:(number || null), rem_code: string]
function parseNumber (code) {
  const exp = /^\s*(-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?)\s*/
  let match = exp.exec(code)
  if (match === null) return [null, code]
  return [parseFloat(match[1]), code.slice(match[0].length)]
}

// (returns: (data || null, rcode))
function evalFunction (code, env, lev) {
  let match = /^(\s*\(([^\s\)]+))(\s|\))/.exec(code) // match anything other than ' ' or ')'
  if (match !== null) { // check valid proc start
    // get proc-name, iterate and eval proc-args while not valid end or err
    const proc = match[2]; let [rcode, val, args] = [code.slice(match[1].length), 0, []]
    while (val !== null) {
      [val, rcode] = evalValue(rcode, env, lev)
      if (val !== null) args.push(val)
    }
    match = /^\s*\)\s*/.exec(rcode)
    if (match === null) return [null, code] // check valid proc end
    if (envStack[0][proc] === undefined) return [null, code] // check valid proc and args
    return [envStack[0][proc](...args), rcode.slice(match[0].length)] // if valid then call proc with args and return value with rcode
  }
  return [null, code]
}

const evaluaters = [parseNumber, evalFunction]
// return [data:(number || null), rem_code: string]
function evalValue (code, env, lev) {
  return evaluaters.reduce((a, f) => (a[0] === null ? f(code, env, lev) : a), [null, code])
}

// (returns: (err, msg, code) || (noerr, data, rcode))
const evalScheme = function (code, env = 0, lev = 0) {
  let [val, rcode, data] = [0, code, '']
  while (val !== null) {
    [val, rcode] = evalValue(rcode, env, lev)
    if (val !== null) data = val
  }
  if (/^\s*$/.exec(rcode) === null) return ['JispError: Something unexpected or not supported', code]
  return [data, rcode]
}

module.exports = evalScheme
