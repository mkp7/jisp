const { evalScheme } = require('../eval_scheme')

test('test eval_scheme', () => {
  expect(evalScheme('(+ 1 2)')[0]).toBe(3)
})

test('test define lambda function', () => {
  expect(evalScheme(`
    (define circle-area (lambda (r) (* pi (* r r))))
    (circle-area 3)
    `)[0]).toBe(28.274333877)
})

test('test recursive lambda function', () => {
  expect(evalScheme(`
    (define fact (lambda (n) (if (<= n 1) 1 (* n (fact (- n 1))))))
    (fact 10)
    `)[0]).toBe(3628800)
})

test('test recursive lambda function with closure lev 1', () => {
  expect(evalScheme(`
    (define twice (lambda (x) (* 2 x)))
    (define repeat (lambda (f) (lambda (x) (f (f x)))))
    ((repeat twice) 10)
    `)[0]).toBe(40)
})

test('test recursive lambda function with closure lev 2', () => {
  expect(evalScheme(`
    (define twice (lambda (x) (* 2 x)))
    (define repeat (lambda (f) (lambda (x) (f (f x)))))
    ((repeat (repeat twice)) 10)
    `)[0]).toBe(160)
})

test('test recursive lambda function with closure lev 3', () => {
  expect(evalScheme(`
    (define twice (lambda (x) (* 2 x)))
    (define repeat (lambda (f) (lambda (x) (f (f x)))))
    ((repeat (repeat (repeat twice))) 10)
    `)[0]).toBe(2560)
})

test('test recursive lambda function with closure lev 4', () => {
  expect(evalScheme(`
    (define twice (lambda (x) (* 2 x)))
    (define repeat (lambda (f) (lambda (x) (f (f x)))))
    ((repeat (repeat (repeat (repeat twice)))) 10)
    `)[0]).toBe(655360)
})

test('test fib', () => {
  expect(evalScheme(`
  (define fib (lambda (n) (if (< n 2) 1 (+ (fib (- n 1)) (fib (- n 2))))))
  (fib 9)`
  )[0]).toBe(55)
})
