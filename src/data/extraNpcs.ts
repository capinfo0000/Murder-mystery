export interface ExtraNpcDef {
  id: string
  role: string
  naturalDeathCause: string     // shown when unrelated to case
  disguisedMurderCause: string  // shown when killed (looks natural)
  trueMurderDetail: string      // revealed at result
}

// Mob staff of 紫苑館 — pool of potential NPC victims (10 entries, enough for 7-player hard mode + noise)
export const EXTRA_NPCS: ExtraNpcDef[] = [
  {
    id: 'cook',
    role: '専属料理人',
    naturalDeathCause: '持病による突発性心不全',
    disguisedMurderCause: '持病の急性増悪（心不全）',
    trueMurderDetail: '深夜に給仕のため廊下を歩いていた際、犯人が現場から立ち去る姿を目撃してしまった。口封じのため翌朝の食事に毒草エキスを混入され、持病を悪化させて殺された',
  },
  {
    id: 'lawyer',
    role: '顧問弁護士',
    naturalDeathCause: '深夜の階段からの転落事故',
    disguisedMurderCause: '夜間の転落（足元が暗かったため）',
    trueMurderDetail: '深夜に書斎で物音を聞きつけて廊下に出たところ、不審な行動をとる人物と鉢合わせしてしまった。口論の末、暗がりの階段から突き落とされた',
  },
  {
    id: 'maid_haru',
    role: 'メイド（客間担当）',
    naturalDeathCause: '急性の食中毒による衰弱',
    disguisedMurderCause: '急性胃腸炎による衰弱死',
    trueMurderDetail: '客室の清掃中に、犯人が隠した証拠品を偶然発見してしまった。知らせる前に口封じするため、その日の夕食に毒を盛られた',
  },
  {
    id: 'gardener',
    role: '庭師の助手',
    naturalDeathCause: '農薬の誤飲（作業中の不注意）',
    disguisedMurderCause: '農薬吸引による急性中毒',
    trueMurderDetail: '早朝の作業中に、犯人が館の裏手で不審な物を処分しようとしている場面を目撃してしまった。その後、作業に使う農薬の瓶をすり替えられて殺された',
  },
  {
    id: 'secretary',
    role: '個人秘書',
    naturalDeathCause: '過労による急性脳梗塞',
    disguisedMurderCause: '突発性の脳血管障害',
    trueMurderDetail: '書類の整理中に、犯人の行動を裏付ける決定的な記録を偶然手に取ってしまった。その夜、飲み物に睡眠薬を大量に混入され、意識を失ったまま脳卒中に見せかけて殺された',
  },
  {
    id: 'footman',
    role: '見習い執事',
    naturalDeathCause: 'アレルギーによるアナフィラキシー（食事中の事故）',
    disguisedMurderCause: '食事中のアレルギー反応（急性）',
    trueMurderDetail: '夜間の見回り中に、犯人が立入禁止区域から出てくる場面を目撃してしまった。翌日の食事にアレルゲン物質を混入され、アナフィラキシーを引き起こして口封じされた',
  },
  {
    id: 'maid_tsuki',
    role: 'メイド（寝室担当）',
    naturalDeathCause: '突発性の発作による転倒・頭部打撲',
    disguisedMurderCause: '転倒による頭部打撲（てんかん様発作）',
    trueMurderDetail: '寝室の整理中に、犯人が隠していた凶器を誤って発見してしまった。取り戻しに来た犯人ともみ合いになり、頭を強打して死亡した',
  },
  {
    id: 'driver',
    role: '専属運転手',
    naturalDeathCause: '車内での一酸化炭素中毒（整備不良）',
    disguisedMurderCause: '車両整備不良による一酸化炭素中毒',
    trueMurderDetail: '深夜、犯人が不審な荷物を館の外に運び出す場面を目撃してしまった。翌朝に発見されないよう、車のマフラーに細工をされて一酸化炭素中毒で殺された',
  },
  {
    id: 'accountant',
    role: '経理担当',
    naturalDeathCause: '長期的な飲酒による急性肝不全',
    disguisedMurderCause: '急性肝不全（既往歴あり）',
    trueMurderDetail: '帳簿の照合作業中に、犯行に絡む不審な金銭の動きを偶然発見してしまった。証拠を隠滅する時間を稼ぐため、連日多量のアルコールを強要されて肝臓を破壊された',
  },
  {
    id: 'night_guard',
    role: '夜警',
    naturalDeathCause: '持病の心臓発作（巡回中）',
    disguisedMurderCause: '巡回中の突発性心停止',
    trueMurderDetail: '深夜の巡回中に犯行現場付近で異音を聞き、確認しに向かったところを背後から急所を突かれた。犯行の目撃者として最も危険な存在だった',
  },
]
