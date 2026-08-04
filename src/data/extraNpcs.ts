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
    // 強請り型：目撃 → 翌朝口止め料要求 → 昼食に毒
    id: 'cook',
    role: '専属料理人',
    naturalDeathCause: '持病による突発性心不全',
    disguisedMurderCause: '持病の急性増悪（心不全）',
    trueMurderDetail: '夕食後の片付け中に犯人が現場を立ち去るのを目撃。翌朝、犯人を呼び出して「口外しない代わりに金をよこせ」と要求した。犯人は了承するふりをして昼食に毒草エキスを混入し、持病の心臓病を急激に悪化させて殺した',
  },
  {
    // 即時型：深夜に鉢合わせ → その場で突き落とし
    id: 'lawyer',
    role: '顧問弁護士',
    naturalDeathCause: '深夜の階段からの転落事故',
    disguisedMurderCause: '夜間の転落（足元が暗かったため）',
    trueMurderDetail: '深夜に書斎の物音を聞きつけ廊下に出たところ、犯人と鉢合わせしてしまった。問い詰めようとした瞬間、犯人に暗がりの階段から突き落とされた',
  },
  {
    // 強請り型：証拠発見 → 当日夜に犯人を問い詰め → 夕食に毒
    id: 'maid_haru',
    role: 'メイド（客間担当）',
    naturalDeathCause: '急性の食中毒による衰弱',
    disguisedMurderCause: '急性胃腸炎による衰弱死',
    trueMurderDetail: '客室の清掃中に犯人が隠した証拠品を発見。その夜に犯人を呼び出して口止め料を要求した。犯人は翌朝の朝食に毒を仕込み、急性胃腸炎を装って殺した',
  },
  {
    // 即時型：早朝に目撃 → 犯人がその場で農薬瓶をすり替え → 同日中毒死
    id: 'gardener',
    role: '庭師の助手',
    naturalDeathCause: '農薬の誤飲（作業中の不注意）',
    disguisedMurderCause: '農薬吸引による急性中毒',
    trueMurderDetail: '早朝の作業中に犯人が館の裏手で不審な行動をしているのを目撃してしまった。犯人は気づかれたと悟り、すぐにその場で農薬の瓶を別の薬品にすり替えた。数時間後、作業中に吸引した庭師の助手は急性中毒で死亡した',
  },
  {
    // 強請り型：書類発見 → 当夜犯人を問い詰め → その夜睡眠薬で殺す
    id: 'secretary',
    role: '個人秘書',
    naturalDeathCause: '過労による急性脳梗塞',
    disguisedMurderCause: '突発性の脳血管障害',
    trueMurderDetail: '書類整理中に犯行を裏付ける決定的な記録を発見し、その夜に犯人を問い詰めた。犯人は「落ち着いて話し合おう」と言いお茶を差し出したが、そこに睡眠薬が大量に混入されていた。意識を失ったまま脳卒中に見せかけて殺された',
  },
  {
    // 強請り型：目撃 → 翌朝口止め料要求 → 昼食にアレルゲン混入
    id: 'footman',
    role: '見習い執事',
    naturalDeathCause: 'アレルギーによるアナフィラキシー（食事中の事故）',
    disguisedMurderCause: '食事中のアレルギー反応（急性）',
    trueMurderDetail: '夜間の見回り中に犯人が立入禁止区域から出てくる場面を目撃。翌朝犯人を呼び出し、黙っていることと引き換えに金品を要求した。犯人は了承したふりをしてその日の昼食にアレルゲン物質を仕込み、アナフィラキシーショックを引き起こして殺した',
  },
  {
    // 即時型：凶器を発見 → 犯人がその場に取り戻しに来てもみ合い → 即死
    id: 'maid_tsuki',
    role: 'メイド（寝室担当）',
    naturalDeathCause: '突発性の発作による転倒・頭部打撲',
    disguisedMurderCause: '転倒による頭部打撲（てんかん様発作）',
    trueMurderDetail: '寝室の整理中に犯人が隠していた凶器を偶然発見してしまった。隠し場所を変えようとしていた犯人がすぐに部屋に戻り、奪い返しにきたところでもみ合いになり、頭を強打して死亡した',
  },
  {
    // 強請り型：深夜に目撃 → 翌朝口止め料要求 → 同夜車細工 → 翌朝死亡
    id: 'driver',
    role: '専属運転手',
    naturalDeathCause: '車内での一酸化炭素中毒（整備不良）',
    disguisedMurderCause: '車両整備不良による一酸化炭素中毒',
    trueMurderDetail: '深夜に犯人が不審な荷物を館の外に運び出す場面を目撃。翌朝、犯人に「見ていたぞ」と告げて口止め料を要求した。犯人はその夜のうちに車のマフラーに細工を施し、翌朝出勤した運転手を一酸化炭素中毒で殺した',
  },
  {
    // 強請り型：帳簿で不正発見 → 犯人を問い詰め始める → 連日アルコール強要で長期的に殺す
    id: 'accountant',
    role: '経理担当',
    naturalDeathCause: '長期的な飲酒による急性肝不全',
    disguisedMurderCause: '急性肝不全（既往歴あり）',
    trueMurderDetail: '帳簿の照合中に犯行に絡む不審な金銭の動きを発見し、犯人を問い詰め始めた。犯人は証拠を隠滅する時間を稼ぐため毎晩「接待だ」と言ってアルコールを飲ませ続け、数日後に肝不全を起こして死亡させた',
  },
  {
    // 即時型：異音を聞いて確認しに行ったその場で背後から急所を突かれる
    id: 'night_guard',
    role: '夜警',
    naturalDeathCause: '持病の心臓発作（巡回中）',
    disguisedMurderCause: '巡回中の突発性心停止',
    trueMurderDetail: '深夜の巡回中に犯行現場付近で異音を聞き、確認しに向かったところを背後から急所を突かれた。現行犯を目撃されるわけにはいかなかった犯人による、とっさの犯行だった',
  },
]
