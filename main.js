'use strict'
const evalScheme = require('./eval_scheme')
const globalEnv = require('./global_env')
const prompt = 'jisp > '

process.stdout.write(prompt)
process.stdin.on('data', function (inputStdin) {
  let ev = evalScheme(inputStdin.toString('utf8'), globalEnv)
  process.stdout.write((ev[0] === null ? ev[2] : ev[0]) + '\n')
  process.stdout.write(prompt)
})
