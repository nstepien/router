import { isPlainObject } from './utils'

export interface RouterTransformer {
  stringify: (obj: unknown) => string
  parse: (str: string) => unknown
}

export const defaultTransformer: RouterTransformer = {
  stringify: (value: any) =>
    JSON.stringify(value, function replacer(key, value) {
      const keyVal = this[key]
      const transformer = transformers.find((t) => t.stringifyCondition(keyVal))

      if (transformer) {
        return transformer.stringify(keyVal)
      }

      return value
    }),
  parse: (value: string) =>
    JSON.parse(value, function parser(key, value) {
      const keyVal = this[key]
      const transformer = transformers.find((t) => t.parseCondition(keyVal))

      if (transformer) {
        return transformer.parse(keyVal)
      }

      return value
    }),
}

const transformers = [
  {
    // Dates
    stringifyCondition: (value: any) => value instanceof Date,
    stringify: (value: any) => ({ $date: value.toISOString() }),
    parseCondition: (value: any) => isPlainObject(value) && value.$date,
    parse: (value: any) => new Date(value.$date),
  },
  {
    // undefined
    stringifyCondition: (value: any) => value === undefined,
    stringify: () => ({ $undefined: '' }),
    parseCondition: (value: any) =>
      isPlainObject(value) && value.$undefined === '',
    parse: () => undefined,
  },
] as const

export type TransformerStringify<T, TSerializable> = T extends TSerializable
  ? T
  : T extends (...args: Array<any>) => any
    ? 'Function is not serializable'
    : { [K in keyof T]: TransformerStringify<T[K], TSerializable> }

export type TransformerParse<T, TSerializable> = T extends TSerializable
  ? T
  : T extends JSX.Element
    ? ReadableStream
    : { [K in keyof T]: TransformerParse<T[K], TSerializable> }

export type DefaultTransformerStringify<T> = TransformerStringify<
  T,
  Date | undefined
>

export type DefaultTransformerParse<T> = TransformerParse<T, Date | undefined>
