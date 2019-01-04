'use strict'
const evalScheme = require('./eval_scheme')
const prompt = 'jisp >'

process.stdout.write(prompt)
process.stdin.on('data', function (inputStdin) {
  let ev = evalScheme(inputStdin.toString('utf8'))
  // process.stdout.write(ev[0] + '\n' + ev[1] + '\n' + JSON.stringify(ev[2]) + '\n')
  process.stdout.write(ev[0] + '\n')
  process.stdout.write(prompt)
})
