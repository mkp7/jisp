const langSpec = [
  /^(\s*)(-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?)(\)|\s)/, // [0]number
  // /^\s*([a-zA-Z0-9_-]+)(\s|\))/, // [1]symbol
  // /^\s*\(if\s/, // [2]conditional
  // /^\s*\(define\s/, // [3]definition
  /^\s*\(\s*/, // [1]procedure (level) start
  /^\s*\)\s*/, // [2]procedure (level) end
  /^(\s*([^\s\)]+))(\s|\))/ // [3]procedure name
]

let envStack = [{
  '+': (...nums) => (nums.length === 0 ? 0 : nums.reduce((a, b) => a + b)),
  '-': (...nums) => (nums.length === 0 ? 0 : nums.reduce((a, b) => a - b)),
  '*': (...nums) => (nums.length === 0 ? 0 : nums.reduce((a, b) => a * b)),
  '/': (...nums) => (nums.length === 0 ? 0 : nums.reduce((a, b) => a / b))
}]

const parseKeyword = function (code) {
  let match = langSpec[0].exec(code) // parse number
  if (match !== null) return [0, parseFloat(match[2]), code.slice(match[1].length + match[2].length)]
  match = langSpec[1].exec(code) // parse procedure (level) start
  if (match !== null) return [1, match[0], code.slice(match[0].length)]
  match = langSpec[2].exec(code) // parse procedure (level) end
  if (match !== null) return [2, match[0], code.slice(match[0].length)]
  match = langSpec[3].exec(code) // parse procedure name
  if (match !== null) return [3, match[2], code.slice(match[1].length)]
  return null
}

// (returns: (err, msg, code) || (noerr, data, rcode))
const evalScheme = function (code, env = 0, lev = 0) {
  let [err, val, rcode, parse] = [false, 0, code, null]
  parse = parseKeyword(code)
  if (lev === 0) {
    if (parse !== null && parse[0] === 0) {
      val = parse[1]; rcode = parse[2]
    } else if (parse !== null && parse[0] === 1) [err, val, rcode] = evalScheme(parse[2], 0, lev + 1)
    else return [true, '35 JispError: Something unexpected or not supported', code]
    while (/^\s*$/.exec(rcode) === null && !err && rcode) {
      parse = parseKeyword(rcode)
      if (parse !== null && parse[0] === 0) {
        val = parse[1]; rcode = parse[2]
      } else if (parse !== null && parse[0] === 1) [err, val, rcode] = evalScheme(parse[2], 0, lev + 1)
      else return [true, '40 JispError: Something unexpected or not supported', code]
    }
    if (/^\s*$/.exec(rcode) === null) return [true, '42 JispError: Something unexpected or not supported', code]
    return [false, val, rcode]
  }

  let [proc, args] = ['', []]
  if (parse !== null && parse[0] === 0) return [true, '47 JispError: Unexpected number', code]
  else if (parse !== null && parse[0] === 1) return [true, '48 JispError: Cannot call () or procedure is undefined', code]
  else if (parse !== null && parse[0] === 2) return [false, '()', parse[2]]
  else if (parse !== null && parse[0] === 3) [proc, rcode] = [parse[1], parse[2]]
  else return [true, '51 JispError: Something unexpected or not supported', code]
  while (langSpec[2].exec(rcode) === null && !err && rcode) {
    parse = parseKeyword(rcode)
    if (parse !== null && parse[0] === 0) { args.push(parse[1]); rcode = parse[2] }
    if (parse !== null && parse[0] === 1) {
      [err, val, rcode] = evalScheme(parse[2], 0, lev + 1)
      if (err) return [err, val, rcode]
      args.push(val)
    }
  }
  if (langSpec[2].exec(rcode) === null) return [true, '61 JispError: Something unexpected or not supported', code]
  val = envStack[0][proc](...args)
  return [err, val, rcode.slice(langSpec[2].exec(rcode)[0].length)]
}

module.exports = evalScheme
