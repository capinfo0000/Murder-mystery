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
]
