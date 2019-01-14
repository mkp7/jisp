const GlobalEnv = [{
  '+': (env, ...nums) => (nums.length === 0 ? 0 : nums.reduce((a, b) => a + b)),
  '-': (env, ...nums) => {
    if (nums.length === 0) {
      return 0
    }

    if (nums.length === 1) {
      return -nums[0]
    }

    return nums.reduce((a, b) => a - b)
  },
  '*': (env, ...nums) => (nums.length === 0 ? 1 : nums.reduce((a, b) => a * b)),
  '/': (env, ...nums) => (nums.length === 0 ? 0 : nums.reduce((a, b) => a / b)),
  '=': (env, a, b) => a === b,
  '<': (env, a, b) => a < b,
  '<=': (env, a, b) => a <= b,
  '>': (env, a, b) => a > b,
  '>=': (env, a, b) => a >= b,
  'car': (env, lst) => lst[0],
  'cdr': (env, lst) => lst.slice(1),
  'first': (env, lst) => lst[0],
  'rest': (env, lst) => lst.slice(1),
  'cons': (env, a, b) => [a, ...b],
  'list': (env, ...a) => a,
  'equal?': (env, a, b) => a === b,
  'map': (env, fn, ls) => {
    if (fn instanceof LambdaExpression) {
      if (fn.params.length !== 1) {
        return 'JispError: More or less number of arguments'
      }
      const valMap = ls.map(itm => {
        const lScope = {}
        lScope[fn.params[0]] = itm

        const val = evalScheme(fn.code, [...env, lScope])
        if (val[0] instanceof LambdaExpression) {
          val[0].env = lScope
        }

        return val[0]
      })

      return valMap
    }

    return ls.map(fn)
  },
  'pi': 3.141592653
}]

function LambdaExpression (params, code, env) {
  this.params = params
  this.code = code
  this.env = env
}

// returns [data || undefined]
function searchEnv (env, key) {
  let i = env.length - 1
  while (i > 0 && env[i][key] === undefined) {
    i--
  }

  return env[i][key]
}

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
function evalConditional (code, env) {
  const ptr = /^(\s*\(\s*if)(\s|\))/
  const ptrC = /^\s*\)\s*/

  let match = ptr.exec(code)
  if (match === null) {
    return [null, code, 'JispError: Not conditional']
  }

  let [value, rcode, err] = evalValue(code.slice(match[1].length), env)
  if (value === null) {
    return [null, rcode, err]
  }

  // meta parse true case and eval and return false case
  let scheme
  if (value === false || (Array.isArray(value) && value.length === 0)) {
    scheme = parseScheme(rcode, env)
    if (scheme[0] === null) {
      return [null, code, 'JispError: Too few operands in form']
    }

    rcode = scheme[1];
    [value, rcode, err] = evalValue(rcode, env)
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
  [value, rcode, err] = evalValue(rcode, env)
  if (value === null) {
    return [value, rcode, err]
  }

  scheme = parseScheme(rcode, env)
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

// returns [data(scheme_exp || null), rem_code: string, err: string]
function evalQuote (code, env) {
  const ptr = /^(\s*\(\s*quote)(\s|\))/
  const ptrC = /^\s*\)\s*/

  let match = ptr.exec(code)
  if (match === null) {
    return [null, code, 'JispError: Not a Quote expression']
  }

  const val = parseScheme(code.slice(match[0].length))
  if (val[0] === null) {
    return val
  }

  match = ptrC.exec(val[1])
  if (match === null) {
    return [null, code, 'JispError: Expected ")"']
  }

  return [val[0], val[1].slice(match[0].length), '']
}

// returns [data:(undefined || null), rem_code: string, err: string]
function evalDefine (code, env) {
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
  [val, rcode, err] = evalValue(rcode, env)
  if (val === null) {
    return [null, code, err]
  }

  match = ptrC.exec(rcode)
  if (match === null) {
    return [null, code, 'JispError: Expected ")"']
  }

  env[0][sym] = val

  return [undefined, rcode.slice(match[0].length), '']
}

// returns [data:(number || null), rem_code: string, err: string]
function evalSymbol (code, env) {
  const ptr = /^\s*([^\s\(\)]+)/

  let match = ptr.exec(code)
  if (match === null) {
    return [
      null,
      code,
      'JispError: Not a symbol'
    ]
  }

  const envVal = searchEnv(env, match[1])
  if (envVal === undefined) {
    return [
      null,
      code,
      `JispError: Unknown identifier: ${match[1]}`
    ]
  }

  return [
    envVal,
    code.slice(match[0].length),
    ''
  ]
}

// returns [data:(scheme_exp || null), rem_code: string, err: string]
function parseScheme (code, env) {
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
  let recurse = parseScheme(rcode, env)
  while (recurse[0] !== null) {
    scheme += recurse[0]
    rcode = recurse[1]
    recurse = parseScheme(rcode, env)
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
function parseLambda (code, env) {
  const ptr = /^\s*\(\s*lambda\s+\((([^\s\(\)]+\s*)+)\)/
  const ptrEnd = /^\s*\)/

  let match = ptr.exec(code) // parse params
  if (match === null) {
    return [null, code, 'JispError: Not lambda expression']
  }

  const params = match[1].replace(/\s+/, ' ').trim().split(' ')
  let rcode = code.slice(match[0].length)

  let scheme = parseScheme(rcode, env)
  if (scheme[0] === null) {
    return [null, code, 'JispError: Expected scheme expression']
  }

  rcode = scheme[1]
  match = ptrEnd.exec(rcode)
  if (match === null) {
    return [null, code, 'JispError: Expected ")"']
  }

  return [new LambdaExpression(params, scheme[0], {}), rcode.slice(match[0].length), '']
}

// returns [data:(array[values] || null), rem_code: string, err: string]
function evalValues (code, env) {
  const ptrEnd = /^\s*(\)\s*)?$/
  let match = ptrEnd.exec(code)
  if (match !== null) {
    return [[], code, '']
  }

  let data = evalValue(code, env)
  if (data[0] === null) {
    return [null, code, data[2]]
  }

  let values = evalValues(data[1], env)
  if (values[0] === null) {
    return [null, code, values[2]]
  }

  return [[data[0], ...values[0]], values[1], '']
}

// returns [data:(number || null), rem_code: string, err: string]
function evalLambdaExpression (code, env) {
  const ptrStart = /^\s*\(/
  let match = ptrStart.exec(code)
  if (match === null) {
    return [null, code, 'JispError: Not a Lambda expression']
  }

  let [lExpr, rcode, err] = parseLambda(code.slice(match[0].length), env)
  if (lExpr === null) {
    return [null, code, err]
  }

  const data = evalValues(rcode, env)
  if (data[0] === null) {
    return [null, code, data[2]]
  }

  // Create &| pass new environment data[0] and lExpr[0]
  if (lExpr.params !== data[0].length) {
    return [null, code, 'JispError: More or less number of arguments']
  }

  const scope = {}
  lExpr.params.forEach((k, i) => (scope[k] = data[0][i]))

  let lEnv = [...env, scope, lExpr.env]
  const val = evalScheme(lExpr.code, lEnv)
  if (val[0] instanceof LambdaExpression) {
    val[0].env = scope
  }

  return val
}

// (returns: (data || null, rcode))
function evalLambdaLiteral (code, env) {
  const ptrStart = /^\s*\(\s*/

  let match = ptrStart.exec(code)
  if (match === null) { // check valid proc start
    return [
      null,
      code,
      'JispError: Not a lambda expression'
    ]
  }
  // check expression evaluates to lambda
  let lambda = evalValue(code.slice(match[0].length), env)
  if (lambda[0] instanceof LambdaExpression) {
    // iterate and eval proc-args while not valid end or err
    let [rcode, tmp, args] = [lambda[1], 0, []]
    while (tmp !== null) {
      [tmp, rcode] = evalValue(rcode, env)
      if (tmp !== null) {
        args.push(tmp)
      }
    }

    let match = /^\s*\)\s*/.exec(rcode) // check valid proc end
    if (match === null) {
      return [
        null,
        code,
        'JispError: Expected ")"'
      ]
    }

    if (lambda[0].params.length !== args.length) {
      return [null, code, 'JispError: More or less number of arguments']
    }

    const scope = {}
    lambda[0].params.forEach((k, i) => (scope[k] = args[i]))

    let lEnv = [...env, scope, lambda[0].env]
    const val = evalScheme(lambda[0].code, lEnv)
    if (val[0] instanceof LambdaExpression) {
      val[0].env = scope
    }

    if (val[0] === null) {
      return val
    }

    return [val[0], rcode.slice(match[0].length), '']
  }

  return [null, code, '']
}

// (returns: (data || null, rcode))
function evalFunction (code, env) {
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
    [val, rcode] = evalValue(rcode, env)
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

  let envVal = searchEnv(env, proc)
  if (envVal === undefined) { // check valid proc and args
    return [
      null,
      code,
      `JispError: Unknown identifier: ${proc}`
    ]
  }

  if (typeof envVal !== 'function') { // check valid function
    return [
      null,
      code,
      `JispError: ${proc} is not a function`
    ]
  }

  // if valid then call proc with args and return value with rcode
  return [
    envVal(env, ...args),
    rcode.slice(match[0].length),
    ''
  ]
}

const evaluaters = [
  parseNumber,
  parseBoolean,
  evalConditional,
  evalDefine,
  evalQuote,
  evalSymbol,
  parseLambda,
  evalLambdaExpression,
  evalLambdaLiteral,
  evalFunction
]

// returns [data:(number || null), rem_code: string, err: string]
function evalValue (code, env) {
  return evaluaters.reduce((a, f) => {
    if (a[0] !== null) {
      return a
    }

    return f(code, env)
  }, [null, code, ''])
}

// (returns: (err, msg, code) || (noerr, data, rcode))
const evalScheme = function (code, env) {
  let [val, rcode, data, err] = [0, code, '', '']

  while (val !== null) {
    [val, rcode, err] = evalValue(rcode, env)
    if (val !== null) {
      data = val
    }
  }

  if (/^\s*$/.exec(rcode) === null) {
    return [null, code, err]
  }

  return [data, '', '']
}

module.exports = { evalScheme, GlobalEnv }
