'use strict'
const { evalScheme, GlobalEnv } = require('./eval_scheme')
// const { GlobalEnv } = require('./global_env')
const prompt = 'jisp > '

process.stdout.write(prompt)
process.stdin.on('data', function (inputStdin) {
  let ev = evalScheme(inputStdin.toString('utf8'), GlobalEnv)
  process.stdout.write((ev[0] === null ? ev[2] : ev[0]) + '\n')
  process.stdout.write(prompt)
})
