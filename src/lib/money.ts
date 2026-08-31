/** 金额工具：数据库存"分"（integer），避免浮点误差 */

/** 元 → 分 */
export function yuanToFen(yuan: number): number {
  return Math.round(yuan * 100)
}

/** 分 → 元 */
export function fenToYuan(fen: number): number {
  return fen / 100
}

/** 分 → 格式化字符串（保留两位小数，千分位） */
export function formatMoney(fen: number): string {
  return fenToYuan(fen).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
