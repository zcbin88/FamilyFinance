/**
 * 旧版 Safari（iOS 15.0 – 15.3）缺失的运行时 API 补丁。
 * 依赖里 zod v4 内部使用了 structuredClone / Object.hasOwn，
 * 这两个 API 需要 Safari 15.4+。此文件必须在所有业务模块之前导入。
 */

// structuredClone：缺失时用 JSON 序列化兜底（zod 用它克隆 Error，随后会重写 message，JSON 方案足够）
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(value: T): T => {
    if (value === null || typeof value !== 'object') return value
    try {
      return JSON.parse(JSON.stringify(value)) as T
    } catch {
      return value
    }
  }
}

// Object.hasOwn：缺失时用原型链上的 hasOwnProperty 兜底
if (typeof Object.hasOwn !== 'function') {
  Object.defineProperty(Object, 'hasOwn', {
    value: (obj: object, key: PropertyKey): boolean =>
      Object.prototype.hasOwnProperty.call(obj, key),
    writable: true,
    configurable: true,
  })
}

export {}
