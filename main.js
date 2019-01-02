'use strict'
const evalScheme = require('./eval_scheme')
const prompt = 'jisp >'

process.stdout.write(prompt)
process.stdin.on('data', function (inputStdin) {
  process.stdout.write(evalScheme(inputStdin.toString('utf8')))
  process.stdout.write(prompt)
})
