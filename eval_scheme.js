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
  '=': (a, b) => a === b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  'PI': 3.14159
}]

// returns [data:(number || null), rem_code: string, err: string]
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

// returns [data:(boolean || null), rem_code: string, err: string]
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

// returns [data:(value || null), rem_code: string, err: string]
function evalConditional (code, env, lev) {
  const ptr = /^(\s*\(\s*if)(\s|\))/
  const ptrC = /^\s*\)\s*/

  let match = ptr.exec(code)
  if (match === null) {
    return [null, code, 'JispError: Not conditional']
  }

  let [value, rcode, err] = evalValue(code.slice(match[1].length))
  if (value === null) {
    return [null, rcode, err]
  }

  // meta parse true case and eval and return false case
  let scheme
  if (value === false) {
    scheme = parseScheme(rcode)
    if (scheme[0] === null) {
      return [null, code, 'JispError: Too few operands in form']
    }

    rcode = scheme[1];
    [value, rcode, err] = evalValue(rcode)
    match = ptrC.exec(rcode)
    if (match !== null) {
      return [
        value === null ? undefined : value,
        rcode.slice(match[0].length),
        err
      ]
    }

    return [null, code, 'JispError: Too many operands in form']
  }

  // meta parse false case and eval and return true case
  [value, rcode, err] = evalValue(rcode)
  if (value === null) {
    return [value, rcode, err]
  }

  scheme = parseScheme(rcode)
  if (scheme[0] === null) {
    match = ptrC.exec(rcode)
    if (match === null) {
      return [null, code, 'JispError: Too many operands in form']
    }

    return [value, rcode.slice(match[0].length), '']
  }

  rcode = scheme[1]
  match = ptrC.exec(rcode)
  if (match === null) {
    return [null, code, 'JispError: Too many operands in form']
  }

  return [value, rcode.slice(match[0].length), '']
}

// returns [data:(undefined || null), rem_code: string, err: string]
function evalDefine (code, env, lev) {
  const ptr = /^(\s*\(\s*define)(\s|\))/
  const ptrS = /^\s*([^\s\(\)]+)/
  const ptrC = /^\s*\)\s*/

  let match = ptr.exec(code)
  if (match === null) {
    return [null, code, 'JispError: Not definition']
  }

  let rcode = code.slice(match[0].length)
  match = ptrS.exec(rcode)
  if (match === null) {
    return [null, code, 'JispError: Not a Symbol']
  }

  const sym = match[1]
  rcode = rcode.slice(match[0].length)

  let val, err
  [val, rcode, err] = evalValue(rcode)
  if (val === null) {
    return [null, code, err]
  }

  match = ptrC.exec(rcode)
  if (match === null) {
    return [null, code, 'JispError: Expected ")"']
  }

  envStack[0][sym] = val

  return [undefined, rcode.slice(match[0].length), '']
}

// returns [data:(number || null), rem_code: string, err: string]
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

// returns [data:(scheme_exp || null), rem_code: string, err: string]
function parseScheme (code) {
  const ptrSingle = /^\s*[^\s\(\)]+\s*/
  let match = ptrSingle.exec(code)
  if (match !== null) {
    return [
      match[0],
      code.slice(match[0].length),
      ''
    ]
  }

  const ptrStart = /^\s*\(\s*([^\s\(\)]+\s*)*/
  match = ptrStart.exec(code)
  if (match === null) {
    return [null, code, 'JispError: Not Scheme expression']
  }

  let scheme = match[0]
  let rcode = code.slice(match[0].length)
  const recurse = parseScheme(rcode)
  if (recurse[0] !== null) {
    scheme += recurse[0]
    rcode = recurse[1]
  }

  const ptrEnd = /^\s*([^\s\(\)]+\s*)*\s*\)/
  match = ptrEnd.exec(rcode)
  if (match === null) {
    return [null, code, 'JispError: Expected ")"']
  }

  return [
    scheme + match[0],
    rcode.slice(match[0].length),
    ''
  ]
}

// returns [data:(lambda_exp([params, body]) || null), rem_code: string, err: string]
function parseLambda (code, env, lev) {
  const ptr = /^\s*\(\s*lambda\s+\((([^\s\(\)]+\s*)+)\)/

  let match = ptr.exec(code) // parse params
  if (match === null) {
    return [null, code, 'JispError: Not lambda expression']
  }

  const params = match[1].replace(/\s+/, ' ').trim().split(' ')
  let rcode = code.slice(match[0].length)

  let scheme = parseScheme(rcode)
  if (scheme[0] === null) {
    return [null, code, 'JispError: Expected scheme expression']
  }

  return [[params, scheme[0]], scheme[1], '']
}

//
// function evalLambda (code, env, lev) {
//   let [lExpr, rcode, err] = parseLambda(code, env, lev)
//   if (lExpr === null) {

//   }
// }

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
  evalConditional,
  evalDefine,
  evalSymbol,
  evalFunction
]

// returns [data:(number || null), rem_code: string, err: string]
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
