import type { CharacterDef, CharacterSlot } from '../types/game'

export const CHARACTERS: Record<string, CharacterDef> = {
  A: {
    slot: 'A',
    name: '神条 薫',
    role: '長男 / 副社長',
    background:
      '神条財閥の長男。表向きは有能な副社長だが、会社の巨額赤字を父に隠し続けてきた。遺産相続を巡り、弟・蓮との確執が深まっている。',
    secretAction:
      '書斎から父親の遺言書を盗み出し、自分に有利な内容に改ざんしようとしていた。',
    t2Location: 'study',
    killerMotive:
      '巨額赤字の発覚と廃嫡を防ぐため、真実を知る被害者を口封じした。',
    relationships: {
      B: '主治医として父の病状を知っており、監視が必要な存在',
      F: '遺産を狙う弟。廃嫡させたい',
      G: '権利を主張する謎の未亡人。排除したい',
    },
  },
  B: {
    slot: 'B',
    name: '白川 悟',
    role: '主治医',
    background:
      '神条家の主治医を10年以上務める中年医師。過去に重大な医療ミスを犯しており、それを被害者に握られ脅迫されていた。',
    secretAction:
      '自分の医療ミスが記録されたカルテを書庫から回収・破棄しようとしていた。',
    t2Location: 'library',
    killerMotive:
      '医療ミスの公表と免許剥奪を防ぐため、脅迫者である被害者を殺害した。',
    relationships: {
      A: '赤字隠蔽を知っているが口外できない立場',
      D: 'メイドから館の様子を探ろうとしていた',
      E: '執事とは長い付き合い。互いの秘密を知っている',
    },
  },
  C: {
    slot: 'C',
    name: '氷室 涼子',
    role: '絵画修復家',
    background:
      '著名な絵画修復家として依頼を受け館に滞在中。実際には館が所蔵する億単位の名画を偽物にすり替えることを企んでいた。',
    secretAction:
      '絵画室で本物の名画を精巧な複製品にすり替えていた。本物はすでに梱包済み。',
    t2Location: 'gallery',
    killerMotive:
      '名画のすり替えに気づいた被害者を証人として口封じした。',
    relationships: {
      A: '依頼主の長男。疑われたくない',
      E: '執事が絵画の管理をしているため、動向を常に把握している',
      G: '未亡人も芸術に詳しく、本物かどうか見極めそうで警戒している',
    },
  },
  D: {
    slot: 'D',
    name: '小夜',
    role: 'メイド長',
    background:
      '神条家に幼少期から仕える無口なメイド長。若いメイドたちを束ねながら、長年の陰湿な虐待への復讐心を胸に秘めている。館の裏通路を熟知している唯一の存在。',
    secretAction:
      '館の秘密通路を使い、主人や客人の部屋を覗き見して情報を収集していた。',
    t2Location: 'secret_passage',
    killerMotive:
      '長年自分を虐待し続けた被害者への積年の復讐を実行した。',
    relationships: {
      B: '主治医が館で何かを探しているのを目撃した',
      C: '修復家が夜中に絵画室に入っていくのを見た',
      E: '執事の行動を逐一把握しており、弱みを握っている',
    },
  },
  E: {
    slot: 'E',
    name: '黒部 達也',
    role: '執事長 / 支配人',
    background:
      '神条家を長年支える老執事長。館の全スタッフを統括する実力者だが、実は被害者の悪事の片棒を担いでおり、その報酬として裏金を受け取っていた。',
    secretAction:
      '金庫室から自分への「手切れ金」として預けられていた裏金を持ち出そうとしていた。',
    t2Location: 'safe_room',
    killerMotive:
      '悪事の全容を暴露すると脅した被害者を口封じした。',
    relationships: {
      A: '赤字隠蔽の共犯者。互いに秘密を持ち合っている',
      B: '主治医の弱みを知っており、均衡関係にある',
      F: '次男が館に戻ってきた理由を疑っている',
    },
  },
  F: {
    slot: 'F',
    name: '神条 蓮',
    role: '庭師 / 次男',
    background:
      '家を飛び出し庭師として生計を立てていた次男。突然呼び戻されたと思ったら廃嫡を告げられ、逆上して館に残り続けている。',
    secretAction:
      '隠し部屋に希少な毒草を持ち込み、秘密裏に育てていた。凶器として使うかは未定だった。',
    t2Location: 'hidden_room',
    killerMotive:
      '廃嫡・絶縁を宣告した被害者への怒りが頂点に達し、毒草エキスを使って殺害した。',
    relationships: {
      A: '兄への強烈な対抗心と嫉妬',
      D: 'メイドとは昔からの仲間。秘密通路の存在を知っている',
      G: '未亡人が正当な相続権を持つかもしれないと脅威を感じている',
    },
  },
  G: {
    slot: 'G',
    name: '綾小路 麗華',
    role: '謎の未亡人',
    background:
      '突然館に現れた謎めいた未亡人。実は被害者の隠し子であり、正式な相続権を主張するために館に不法侵入した。',
    secretAction:
      '館の権利証と自分の出生に関する書類を書斎から密かに奪おうとしていた。',
    t2Location: 'guest_room',
    killerMotive:
      '自分の存在を隠蔽しようとした被害者を、正当な権利のために消した。',
    relationships: {
      A: '兄として認めさせたい存在だが、敵対してくる',
      C: '修復家が持っている書類に自分の秘密が関係していると疑っている',
      E: '執事が全ての秘密を知っていると確信している',
    },
  },
}

export const SLOTS: CharacterSlot[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

export function getSlotsForCount(count: number): CharacterSlot[] {
  return SLOTS.slice(0, count) as CharacterSlot[]
}
