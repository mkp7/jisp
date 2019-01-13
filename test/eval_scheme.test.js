const evalScheme = require('../eval_scheme')
const globalEnv = require('../global_env')

test('test eval_scheme', () => {
  const exp = 3

  expect(evalScheme('(+ 1 2)', globalEnv)[0]).toBe(exp)
})

test('test define lambda function', () => {
  const test = `
    (define circle-area (lambda (r) (* pi (* r r))))
    (circle-area 3)
  `
  const exp = 28.274333877

  expect(evalScheme(test, globalEnv)[0]).toBe(exp)
})

test('test recursive lambda function', () => {
  const test = `
    (define fact (lambda (n) (if (<= n 1) 1 (* n (fact (- n 1))))))
    (fact 10)
  `
  const exp = 3628800

  expect(evalScheme(test, globalEnv)[0]).toBe(exp)
})

test('test recursive lambda function with closure lev 1', () => {
  const test = `
    (define twice (lambda (x) (* 2 x)))
    (define repeat (lambda (f) (lambda (x) (f (f x)))))
    ((repeat twice) 10)
  `
  const exp = 40

  expect(evalScheme(test, globalEnv)[0]).toBe(exp)
})

test('test recursive lambda function with closure lev 2', () => {
  const test = `
    (define twice (lambda (x) (* 2 x)))
    (define repeat (lambda (f) (lambda (x) (f (f x)))))
    ((repeat (repeat twice)) 10)
  `
  const exp = 160

  expect(evalScheme(test, globalEnv)[0]).toBe(exp)
})

test('test recursive lambda function with closure lev 3', () => {
  const test = `
    (define twice (lambda (x) (* 2 x)))
    (define repeat (lambda (f) (lambda (x) (f (f x)))))
    ((repeat (repeat (repeat twice))) 10)
  `
  const exp = 2560

  expect(evalScheme(test, globalEnv)[0]).toBe(exp)
})

test('test recursive lambda function with closure lev 4', () => {
  const test = `
    (define twice (lambda (x) (* 2 x)))
    (define repeat (lambda (f) (lambda (x) (f (f x)))))
    ((repeat (repeat (repeat (repeat twice)))) 10)
  `
  const exp = 655360

  expect(evalScheme(test, globalEnv)[0]).toBe(exp)
})

test('test fib', () => {
  const test = `
    (define fib (lambda (n) (if (< n 2) 1 (+ (fib (- n 1)) (fib (- n 2))))))
    (fib 9)
  `
  const exp = 55

  expect(evalScheme(test, globalEnv)[0]).toBe(exp)
})
