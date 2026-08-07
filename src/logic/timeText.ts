// 事件の時間帯トークン（T1/T2/T3）を明確な時刻表現に変換する。
// T1=20時台(20:00-21:00) / T2=21時台(21:00-22:00・事件発生) / T3=22時台(22:00-23:00)
// カード本文・ハンドアウト・結果画面など、プレイヤーの目に触れる全テキストで使う。
export function naturalizeTime(text: string): string {
  return text
    // T2 系（長いパターンから順に）
    .replace(/T2より前/g, '21時より前')
    .replace(/T2前後/g, '21時前後')
    .replace(/T2の直前/g, '21時の直前')
    .replace(/T2前/g, '21時の直前')
    .replace(/T2(の時間帯|の時刻|の頃|頃)/g, '21時頃')
    .replace(/T2/g, '21時頃')
    // T1 系
    .replace(/T1より前/g, '20時より前')
    .replace(/T1(の時間帯|の時刻|の頃|頃)/g, '20時頃')
    .replace(/T1/g, '20時頃')
    // T3 系
    .replace(/T3(の時間帯|の時刻|の頃|頃)/g, '22時頃')
    .replace(/T3/g, '22時頃')
}

// 時間帯の見出し
export const TIME_LABELS = {
  T1: '20:00〜21:00',
  T2: '21:00〜22:00（事件発生）',
  T3: '22:00〜23:00',
} as const

// タイムラインの各コマの見出し
export const PERIOD_T1 = '20時台（20:00〜21:00）'
export const PERIOD_T2 = '21時台（21:00〜22:00・事件発生）'
export const PERIOD_T3 = '22時台（22:00〜23:00）'
