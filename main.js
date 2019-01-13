'use strict'
const evalScheme = require('./eval_scheme')
const prompt = 'jisp > '

process.stdout.write(prompt)
process.stdin.on('data', function (inputStdin) {
  let ev = evalScheme.evalScheme(inputStdin.toString('utf8'), 0)
  process.stdout.write((ev[0] === null ? ev[2] : ev[0]) + '\n')
  process.stdout.write(prompt)
})
