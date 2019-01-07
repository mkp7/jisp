let envStack = [{
  '+': (...nums) => (nums.length === 0 ? 0 : nums.reduce((a, b) => a + b)),
  '-': (...nums) => {
    if (nums.length === 0) {
      return 0
    }

    if (nums.length === 1) {
      return -nums[0]
    }

    return nums.reduce((a, b) => a - b)
  },
  '*': (...nums) => (nums.length === 0 ? 1 : nums.reduce((a, b) => a * b)),
  '/': (...nums) => (nums.length === 0 ? 0 : nums.reduce((a, b) => a / b)),
  'PI': 3.14159
}]

// return [data:(number || null), rem_code: string]
function parseNumber (code) {
  const ptr = /^\s*(-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?)\s*/

  let match = ptr.exec(code)
  if (match === null) {
    return [
      null,
      code,
      'JispError: Not a number'
    ]
  }

  return [
    parseFloat(match[1]),
    code.slice(match[0].length),
    ''
  ]
}

// return [data:(boolean || null), rem_code: string]
function parseBoolean (code) {
  const ptrTrue = /^(\s*(true|#t))(\s|\))/
  const ptrFalse = /^(\s*(false|#f))(\s|\))/

  let match = ptrTrue.exec(code)
  if (match !== null) {
    return [
      true,
      code.slice(match[1].length),
      ''
    ]
  }

  match = ptrFalse.exec(code)
  if (match !== null) {
    return [
      false,
      code.slice(match[1].length),
      ''
    ]
  }

  return [
    null,
    code,
    'JispError: Not a Boolean value'
  ]
}

// return [data:(value || null), rem_code: string]
function evalConditional (code, env, lev) {
  const ptr = /^(\s*\(\s*if)(\s|\))/

  let match = ptr.exec(code)
  if (match === null) {
    return [
      null,
      code,
      'JispError: Not conditional'
    ]
  }

  let [predicate, rcode, err] = evalValue(code.slice(match[1].length))
  if (predicate === null) {
    return [null, rcode, err]
  }

  if (predicate === false) {
    // meta parse true case and eval and return false case
  }

  // meta parse false case and eval and return true case
}

// return [data:(number || null), rem_code: string]
function evalSymbol (code, env, lev) {
  const ptr = /^\s*([^\s\(\)]+)/

  let match = ptr.exec(code)
  if (match === null) {
    return [
      null,
      code,
      'JispError: Not a symbol'
    ]
  }

  if (envStack[0][match[1]] === undefined) {
    return [
      null,
      code,
      `JispError: Unknown identifier: ${match[1]}`
    ]
  }

  return [
    envStack[0][match[1]],
    code.slice(match[0].length),
    ''
  ]
}

// (returns: (data || null, rcode))
function evalFunction (code, env, lev) {
  const ptr = /^(\s*\(\s*([^\s\)]+))(\s|\))/

  let match = ptr.exec(code) // match anything other than ' ' or ')'
  if (match === null) { // check valid proc start
    return [
      null,
      code,
      'JispError: Not a procedure'
    ]
  }

  const proc = match[2] // get proc-name

  // iterate and eval proc-args while not valid end or err
  let [rcode, val, args] = [code.slice(match[1].length), 0, []]
  while (val !== null) {
    [val, rcode] = evalValue(rcode, env, lev)
    if (val !== null) {
      args.push(val)
    }
  }

  match = /^\s*\)\s*/.exec(rcode) // check valid proc end
  if (match === null) {
    return [
      null,
      code,
      'JispError: Expected ")"'
    ]
  }

  if (envStack[0][proc] === undefined) { // check valid proc and args
    return [
      null,
      code,
      `JispError: Unknown identifier: ${proc}`
    ]
  }

  // if valid then call proc with args and return value with rcode
  return [
    envStack[0][proc](...args),
    rcode.slice(match[0].length),
    ''
  ]
}

const evaluaters = [
  parseNumber,
  parseBoolean,
  evalSymbol,
  evalFunction
]

// return [data:(number || null), rem_code: string]
function evalValue (code, env, lev) {
  return evaluaters.reduce((a, f) => {
    if (a[0] !== null) {
      return a
    }

    return f(code, env, lev)
  }, [null, code, ''])
}

// (returns: (err, msg, code) || (noerr, data, rcode))
const evalScheme = function (code, env = 0, lev = 0) {
  let [val, rcode, data, err] = [0, code, '', '']

  while (val !== null) {
    [val, rcode, err] = evalValue(rcode, env, lev)
    if (val !== null) {
      data = val
    }
  }

  if (/^\s*$/.exec(rcode) === null) {
    return [err, code]
  }

  return [data, rcode]
}

module.exports = evalScheme
