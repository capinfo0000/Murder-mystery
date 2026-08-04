export interface VictimBackgroundDef {
  id: string
  summary: string
  detail: string
}

export const VICTIM_BACKGROUNDS: VictimBackgroundDef[] = [
  {
    id: 'blackmailer',
    summary: '複数人を長年脅迫していた',
    detail:
      '被害者は館の住人それぞれの秘密を握り、沈黙の代償として金品や服従を強要していた。誰もが一度は「殺したい」と思ったことがあるはずだ。',
  },
  {
    id: 'heir_monopoly',
    summary: '遺産を独占するため他の相続人を排除しようとしていた',
    detail:
      '被害者は遺言書を操作し、本来の相続人たちを締め出して全財産を手に入れようとしていた。正当な権利を奪われる者が複数いた。',
  },
  {
    id: 'puppet_master',
    summary: '全員の秘密を握り、館全体を支配していた',
    detail:
      '被害者は長年をかけて館の住人全員の弱みを集め、それを使って人形のように操っていた。自由を奪われ続けた者たちの怒りは臨界点に達していた。',
  },
  {
    id: 'confessor',
    summary: '過去の共同犯罪を告白しようとしていた',
    detail:
      '被害者はある日突然、かつて仲間と共に犯した罪を警察に自首すると宣言した。巻き添えを食らう者たちには黙っている理由がない。',
  },
  {
    id: 'organization_puppet_1',
    summary: '裏社会の資金で財閥を築き、組織の指示で人を支配してきた',
    detail:
      '被害者は巨大犯罪組織の資金を元手に財産と地位を築き、組織の意向に従って周囲の人間を操ってきた。しかし組織にとって利用価値が尽きた夜、証拠ごと消された。',
  },
  {
    id: 'organization_puppet_2',
    summary: '組織への巨額負債を抱え、資産ごと差し押さえられることを察知していた',
    detail:
      '被害者は組織との取引で巨額の負債を積み上げており、いつ資産を丸ごと回収されるかわからない状況だった。組織は証拠を残さないため、負債を「帳消し」にする形で始末した。',
  },
]
