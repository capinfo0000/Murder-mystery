export interface ExtraNpcDef {
  id: string
  name: string
  role: string
  naturalDeathCause: string     // shown when unrelated to case
  disguisedMurderCause: string  // shown when killed (looks natural)
  trueMurderDetail: string      // revealed at result
}

// Mob staff of 紫苑館 — pool of potential NPC victims (10 entries, enough for 7-player hard mode + noise)
export const EXTRA_NPCS: ExtraNpcDef[] = [
  {
    id: 'cook',
    name: '橘 千代',
    role: '専属料理人',
    naturalDeathCause: '持病による突発性心不全',
    disguisedMurderCause: '持病の急性増悪（心不全）',
    trueMurderDetail: '夕食に微量の毒草エキスを混入され、持病の心臓病を悪化させて殺された',
  },
  {
    id: 'lawyer',
    name: '木村 誠一',
    role: '顧問弁護士',
    naturalDeathCause: '深夜の階段からの転落事故',
    disguisedMurderCause: '夜間の転落（足元が暗かったため）',
    trueMurderDetail: '遺言書の内容を知りすぎたため、暗闇の中で突き落とされた',
  },
  {
    id: 'maid_haru',
    name: '春野 花',
    role: 'メイド（客間担当）',
    naturalDeathCause: '急性の食中毒による衰弱',
    disguisedMurderCause: '急性胃腸炎による衰弱死',
    trueMurderDetail: '犯行を偶然目撃したため、翌朝の食事に毒を盛られた',
  },
  {
    id: 'gardener',
    name: '熊沢 三郎',
    role: '庭師の助手',
    naturalDeathCause: '農薬の誤飲（作業中の不注意）',
    disguisedMurderCause: '農薬吸引による急性中毒',
    trueMurderDetail: '不審な人物の行動を目撃し、農薬の瓶をすり替えられた',
  },
  {
    id: 'secretary',
    name: '池田 里奈',
    role: '個人秘書',
    naturalDeathCause: '過労による急性脳梗塞',
    disguisedMurderCause: '突発性の脳血管障害',
    trueMurderDetail: '帳簿の不正を知っており、睡眠薬を大量に飲まされた後に脳卒中に見せかけられた',
  },
  {
    id: 'footman',
    name: '志田 純',
    role: '見習い執事',
    naturalDeathCause: 'アレルギーによるアナフィラキシー（食事中の事故）',
    disguisedMurderCause: '食事中のアレルギー反応（急性）',
    trueMurderDetail: '金庫室に出入りする人物を目撃し、食事にアレルゲンを混入されて口封じされた',
  },
  {
    id: 'maid_tsuki',
    name: '月岡 鈴',
    role: 'メイド（寝室担当）',
    naturalDeathCause: '突発性の発作による転倒・頭部打撲',
    disguisedMurderCause: '転倒による頭部打撲（てんかん様発作）',
    trueMurderDetail: '主人の寝室で争いを目撃し、争いの最中に頭を打って死亡した',
  },
  {
    id: 'driver',
    name: '坂本 浩二',
    role: '専属運転手',
    naturalDeathCause: '車内での一酸化炭素中毒（整備不良）',
    disguisedMurderCause: '車両整備不良による一酸化炭素中毒',
    trueMurderDetail: '秘密の外出を知りすぎていたため、車のマフラーに細工をされた',
  },
  {
    id: 'accountant',
    name: '桐嶋 謙吾',
    role: '経理担当',
    naturalDeathCause: '長期的な飲酒による急性肝不全',
    disguisedMurderCause: '急性肝不全（既往歴あり）',
    trueMurderDetail: '裏帳簿の存在を知っており、連日多量のアルコールを摂取させられて肝臓を破壊された',
  },
  {
    id: 'night_guard',
    name: '荒木 宗平',
    role: '夜警',
    naturalDeathCause: '持病の心臓発作（巡回中）',
    disguisedMurderCause: '巡回中の突発性心停止',
    trueMurderDetail: '犯行現場付近を巡回中に異変を目撃し、背後から急所を突かれた',
  },
]
