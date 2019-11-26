// ouput

import { Lexer } from 'chevrotain'
import _ from 'lodash'
import log from './lib/log.js'

import { allTokens } from './lib/token'
import CalculatorPure from './lib/parser'
import CalculatorInterpreter from './lib/visitor'
import rules from './lib/customRule'

for (const key in rules) {
  const rule = rules[key]
  // allTokens[key] = rule.makeToken()
  allTokens.push(rule.makeToken())
}

// console.log(allTokens)

function cst () {
  'use strict'
  /**
   * An Example of implementing a Calculator with separated grammar and semantics (actions).
   * This separation makes it easier to maintain the grammar and reuse it in different use cases.
   *
   * This is accomplished by using the automatic CST (Concrete Syntax Tree) output capabilities
   * of chevrotain.
   *
   * See farther details here:
   * https://github.com/SAP/chevrotain/blob/master/docs/concrete_syntax_tree.md
   */
  const CalculatorLexer = new Lexer(allTokens, {
    // ensureOptimizations: true,
    // traceInitPerf: true,
    // skipValidations: true
  })
  return {
    lexer: CalculatorLexer,
    _Parser: CalculatorPure,
    Visitor: CalculatorInterpreter,
    defaultRuleName: 'expression'
  }
}

const instance = cst()
const { lexer, _Parser, defaultRuleName, Visitor } = instance
const parser = new _Parser([])
// const visitor = new Visitor([])

function parserString (str, visitor) {
  if (!str) { return str }
  if (_.isBoolean(str) || _.isNumber(str)) { return str }

  let parseResult, printResult

  function lex (text) {
    const lexResult = lexer.tokenize(text)
    return lexResult
  }

  function parse (lexResult, startRuleName) {
    parser.reset()
    parser.input = lexResult.tokens
    var value = parser[defaultRuleName]()
    return { value: value, parseErrors: parser.errors }
  }
  var lexResult = lex(str, defaultRuleName)

  // may be falsy if the example is for the lexer only
  if (parser) {
    parseResult = parse(lexResult, defaultRuleName)
    // markInputErrors(lexResult.errors, parseResult.parseErrors)
    if (visitor) {
      // console.log(parseResult.value)
      printResult = visitor.visit(parseResult.value)
    } else {
      printResult = parseResult.value
    }
  }
  // else {
  //     markInputErrors(lexResult.errors, [])
  //     printResult = _.mapValues(lexResult, function (value, key) {
  //         if (key === "tokens") {
  //             return _.map(value, function (token) {
  //                 token.tokenName = chevrotain.tokenName(token.constructor)
  //                 return token
  //             })
  //         }
  //         else {
  //             return value
  //         }
  //     })
  // }
  log.log(printResult)
  var processedResult
  log.log(`string is: ${str}`)
  if (_.isString(printResult)) {
    log.log('step: 1')
    processedResult = printResult // no processing needed
  } else if (_.isNumber(printResult) || _.isBoolean(printResult)) {
    log.log('step: 2')
    processedResult = printResult
  } else if (_.isObject(printResult)) {
    log.log('step: 3')
    processedResult = printResult
  } else {
    // 在这一步可以统一返回输入值
    log.log('step: 4')
    log.log(JSON.stringify(
      {
        Lexing: {
          result: lexResult.errors.length > 0 ? 'FAILURE' : 'SUCCESS',
          num_of_tokens: lexResult.tokens.length,
          lexing_errors: lexResult.errors
        },
        Parsing: {
          result: parser.errors.length > 0 ? 'FAILURE' : 'SUCCESS',
          parsing_errors: _.map(parser.errors, function (currError) {
            return _.omit(currError, ['context'])
          })
        }
      },
      null,
      '\t'
    ))
    processedResult = str
  }
  log.log(`result : ${processedResult}`)
  return processedResult
}

function parserFn (value, data, node, v) {
  const visitor = v || new Visitor([], data, node)
  let res
  switch (typeof value) {
    case 'string':
      res = parserString(value, visitor)
      break
    case 'number':
    case 'boolean':
      res = value
      break
    case 'object':
    // res = value
      for (const key in value) {
        value[key] = parserFn(value[key], data, node, visitor)
      }
      // console.log(value)
      res = value
      break
  }
  return res
}

export default parserFn
