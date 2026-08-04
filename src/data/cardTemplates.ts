import type { CardCategory, CharacterSlot } from '../types/game'

export interface CardTemplate {
  id: string
  content: string
  category: CardCategory
  relatedSlot: CharacterSlot | null
  baseIsTrue: boolean
  condition?: string
}

export const CARD_TEMPLATES: CardTemplate[] = [
  // ───── 物的証拠（physical）─────
  {
    id: 'ph_001',
    content: '書斎の絨毯に乾いた血痕が発見された。家具の影に隠れており、拭き取った形跡がある。',
    category: 'physical', relatedSlot: null, baseIsTrue: true, condition: 'crime_scene:study',
  },
  {
    id: 'ph_002',
    content: '図書室の本棚の奥に、破り取られたページだけが残っていた。内容は医療記録のようだ。',
    category: 'physical', relatedSlot: 'B', baseIsTrue: true,
  },
  {
    id: 'ph_003',
    content: '絵画室の裏側に、精巧に複製された油絵が梱包されずに放置されていた。',
    category: 'physical', relatedSlot: 'C', baseIsTrue: true,
  },
  {
    id: 'ph_004',
    content: '金庫室の床に土足の跡が残っていた。外来の靴底のパターンだ。',
    category: 'physical', relatedSlot: 'E', baseIsTrue: true,
  },
  {
    id: 'ph_005',
    content: '隠し部屋に見慣れない植物が植えられた鉢が複数ある。葉に毒性があることで知られる種類だ。',
    category: 'physical', relatedSlot: 'F', baseIsTrue: true,
  },
  {
    id: 'ph_006',
    content: '被害者の飲みかけのワイングラスから、かすかな苦味のする沈殿物が検出された。',
    category: 'physical', relatedSlot: null, baseIsTrue: true, condition: 'weapon:poison_wine',
  },
  {
    id: 'ph_007',
    content: '食堂のテーブルの下に、遺言書と思われる封筒が落ちていた。封は切られていた。',
    category: 'physical', relatedSlot: 'A', baseIsTrue: true,
  },
  {
    id: 'ph_008',
    content: '温室の水やりバケツに、布製の手袋が浸けられていた。血が洗い落とされた形跡がある。',
    category: 'physical', relatedSlot: null, baseIsTrue: true, condition: 'crime_scene:greenhouse',
  },
  {
    id: 'ph_009',
    content: '客室のベッドの下に、他家の家紋が入った巾着袋が隠されていた。権利証のような書類が入っていた。',
    category: 'physical', relatedSlot: 'G', baseIsTrue: true,
  },
  {
    id: 'ph_010',
    content: '地下室の壁に、誰かが激しく引っ掻いたような爪痕が残っていた。',
    category: 'physical', relatedSlot: null, baseIsTrue: true, condition: 'crime_scene:basement',
  },
  {
    id: 'ph_011',
    content: '廊下の壁に高さ150cmほどの位置に、ワインが飛び散った痕がある。言い争いの形跡かもしれない。',
    category: 'physical', relatedSlot: null, baseIsTrue: false,
  },
  {
    id: 'ph_012',
    content: '厨房の棚の奥に、ラベルのない茶色い小瓶が隠されていた。（後でBが「常備薬だ」と言い訳した）',
    category: 'physical', relatedSlot: 'B', baseIsTrue: false,
  },
  {
    id: 'ph_013',
    content: '庭師の道具箱の中に、先が赤く染まったナイフが見つかった。（庭の剪定で使う赤い紐を切っていた）',
    category: 'physical', relatedSlot: 'F', baseIsTrue: false,
  },
  {
    id: 'ph_014',
    content: '書斎の引き出しに、Eの指紋が残っていた。（Eは定期的に書斎の掃除を担当している）',
    category: 'physical', relatedSlot: 'E', baseIsTrue: false,
  },
  {
    id: 'ph_015',
    content: '被害者の部屋の窓枠に、黒い布の繊維が引っかかっていた。（Dのエプロンと同じ素材だ）',
    category: 'physical', relatedSlot: 'D', baseIsTrue: false,
  },
  {
    id: 'ph_016',
    content: 'ガラスのデキャンタに口紅の跡がある。被害者のものでも、使用人のものでもない色だ。',
    category: 'physical', relatedSlot: 'G', baseIsTrue: false,
  },
  {
    id: 'ph_017',
    content: '絵画室の額縁の裏に、数字の羅列が書かれた紙片が貼り付けられていた。金庫の組み合わせではないか。',
    category: 'physical', relatedSlot: 'C', baseIsTrue: false,
  },
  {
    id: 'ph_018',
    content: '秘密通路の出口近くに、白い粉が散らばっていた。（後に壁のしっくいが剥落したものと判明）',
    category: 'physical', relatedSlot: 'D', baseIsTrue: false,
  },

  // ───── アリバイ証言（alibi）─────
  {
    id: 'al_001',
    content: '私はT2の時間帯に書斎の前を通った際、中から紙をめくる音が聞こえたのを確かに覚えている。',
    category: 'alibi', relatedSlot: 'A', baseIsTrue: true,
  },
  {
    id: 'al_002',
    content: 'T2頃、図書室の明かりが点いていた。誰かが本棚を漁っているような物音も聞こえた。',
    category: 'alibi', relatedSlot: 'B', baseIsTrue: true,
  },
  {
    id: 'al_003',
    content: '夜の11時頃、絵画室から重い物を動かす音がした。扉の隙間から明かりが漏れていた。',
    category: 'alibi', relatedSlot: 'C', baseIsTrue: true,
  },
  {
    id: 'al_004',
    content: 'T2の時刻、廊下の壁がかすかに振動した。誰かが秘密通路を移動していたのではないか。',
    category: 'alibi', relatedSlot: 'D', baseIsTrue: true,
  },
  {
    id: 'al_005',
    content: '金庫室のある方向から、金属音が断続的に聞こえた。鍵をいじる音のように聞こえた。',
    category: 'alibi', relatedSlot: 'E', baseIsTrue: true,
  },
  {
    id: 'al_006',
    content: '温室の方から土の香りが漂ってきた。夜中に植物の世話をしている者がいたようだ。',
    category: 'alibi', relatedSlot: 'F', baseIsTrue: true,
  },
  {
    id: 'al_007',
    content: 'T2の時間帯、客室の廊下側の扉が少し開いていた。中から書類を漁る音がした。',
    category: 'alibi', relatedSlot: 'G', baseIsTrue: true,
  },
  {
    id: 'al_008',
    content: 'T2の頃、Aが「ずっと自室で眠っていた」と主張していたが、廊下でAの足音を聞いた者がいる。',
    category: 'alibi', relatedSlot: 'A', baseIsTrue: true,
  },
  {
    id: 'al_009',
    content: 'Bは「夕食後から朝まで自室にいた」と言っているが、T2頃に廊下で誰かとすれ違った。背格好はBに似ていた。',
    category: 'alibi', relatedSlot: 'B', baseIsTrue: true,
  },
  {
    id: 'al_010',
    content: 'T1の時間帯、CとGが廊下で小声で話しているのを偶然見かけた。何かを渡しているように見えた。',
    category: 'alibi', relatedSlot: null, baseIsTrue: false,
  },
  {
    id: 'al_011',
    content: 'EはT2頃に「書斎を整理していた」と言っているが、書斎のランプは消えていたと他の者が証言している。',
    category: 'alibi', relatedSlot: 'E', baseIsTrue: false,
  },
  {
    id: 'al_012',
    content: 'T3の時間帯にDが被害者の部屋の前をうろついていた。（実際はトレイを回収しに来ただけだった）',
    category: 'alibi', relatedSlot: 'D', baseIsTrue: false,
  },
  {
    id: 'al_013',
    content: 'FはT2の時間帯、食堂で紅茶を飲んでいたと言う者がいる。（その者の記憶は別日のことと後に判明）',
    category: 'alibi', relatedSlot: 'F', baseIsTrue: false,
  },
  {
    id: 'al_014',
    content: 'T1頃、GとAが口論しているのを廊下で目撃した。怒鳴り声が廊下まで聞こえた。',
    category: 'alibi', relatedSlot: null, baseIsTrue: false,
  },

  // ───── 心理・感情（psychology）─────
  {
    id: 'ps_001',
    content: '夕食の席でAは珍しく酒を断った。視線が落ち着かず、食事もほとんど手をつけなかった。',
    category: 'psychology', relatedSlot: 'A', baseIsTrue: true,
  },
  {
    id: 'ps_002',
    content: 'BはT1の時間帯、何度も時計を確認していた。「今夜は早く終わらせたい」と独り言を言っていた。',
    category: 'psychology', relatedSlot: 'B', baseIsTrue: true,
  },
  {
    id: 'ps_003',
    content: 'Cは被害者と目が合うたびに視線を逸らしていた。被害者が近づくと表情が明らかに緊張していた。',
    category: 'psychology', relatedSlot: 'C', baseIsTrue: true,
  },
  {
    id: 'ps_004',
    content: 'Dは普段から無口だが、この夜は特に静かだった。被害者の名前が出るたびにかすかに眉が動いた。',
    category: 'psychology', relatedSlot: 'D', baseIsTrue: true,
  },
  {
    id: 'ps_005',
    content: 'Eはいつもと違い、被害者の部屋への出入りを記録していなかった。訪問記録に空白がある。',
    category: 'psychology', relatedSlot: 'E', baseIsTrue: true,
  },
  {
    id: 'ps_006',
    content: 'Fは事件当夜、酒を大量に飲んでいた。「許せない」「終わらせる」などの言葉を繰り返していた。',
    category: 'psychology', relatedSlot: 'F', baseIsTrue: true,
  },
  {
    id: 'ps_007',
    content: 'Gは到着直後から目的の場所を確認するように館内を歩き回っていた。地図を持っているように見えた。',
    category: 'psychology', relatedSlot: 'G', baseIsTrue: true,
  },
  {
    id: 'ps_008',
    content: 'AとFは事件前夜、激しい口論をしていた。「お前のせいで全部台無しだ」という怒鳴り声を聞いた。',
    category: 'psychology', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'ps_009',
    content: 'Cは夜遅く一人でワインを飲みながら、「もう少しで全部うまくいく」と呟いていた。',
    category: 'psychology', relatedSlot: 'C', baseIsTrue: false,
  },
  {
    id: 'ps_010',
    content: 'Bは被害者と廊下で二人きりになった際、明らかに身を縮めていた。服従しているように見えた。',
    category: 'psychology', relatedSlot: 'B', baseIsTrue: true,
  },
  {
    id: 'ps_011',
    content: 'Dは被害者の前では無表情だったが、その場を離れた後、壁を手で叩いたのを誰かが目撃した。',
    category: 'psychology', relatedSlot: 'D', baseIsTrue: true,
  },
  {
    id: 'ps_012',
    content: 'Gは到着時から被害者と目を合わせようとしなかった。（実際は被害者にGの存在を知られたくなかったため）',
    category: 'psychology', relatedSlot: 'G', baseIsTrue: true,
  },
  {
    id: 'ps_013',
    content: 'Eは事件前日、誰かに電話をかけていた。「準備はできている」「手は打ってある」という声が聞こえた。',
    category: 'psychology', relatedSlot: 'E', baseIsTrue: false,
  },
  {
    id: 'ps_014',
    content: 'FはT1頃、被害者の部屋の前で立ち止まり、長い間じっと扉を見つめていた。',
    category: 'psychology', relatedSlot: 'F', baseIsTrue: false,
  },

  // ───── 背景情報（background）─────
  {
    id: 'bg_001',
    content: '神条家の財務記録によると、過去3年間で子会社の損失が20億円以上に上るが、株主には報告されていない。',
    category: 'background', relatedSlot: 'A', baseIsTrue: true,
  },
  {
    id: 'bg_002',
    content: '10年前、Bの担当患者が術後に死亡した。遺族への謝罪はなく、病院はすべて「自然死」として処理した。',
    category: 'background', relatedSlot: 'B', baseIsTrue: true,
  },
  {
    id: 'bg_003',
    content: '美術界では、最近「紫苑館コレクション」の一部作品の真贋に疑義を呈する専門家が出始めている。',
    category: 'background', relatedSlot: 'C', baseIsTrue: true,
  },
  {
    id: 'bg_004',
    content: '館の古い使用人によると、Dは幼少期から「奥様の人形」として扱われ、感情を表すことを禁じられていた。',
    category: 'background', relatedSlot: 'D', baseIsTrue: true,
  },
  {
    id: 'bg_005',
    content: '登記簿によると、「紫苑館」の土地の一部は30年前に別名義で購入されており、現在の所有権は曖昧だ。',
    category: 'background', relatedSlot: 'G', baseIsTrue: true,
  },
  {
    id: 'bg_006',
    content: '神条家の遺言書には、正規の相続人以外にも「隠された血縁者」への言及があると弁護士が漏らしていた。',
    category: 'background', relatedSlot: 'G', baseIsTrue: true,
  },
  {
    id: 'bg_007',
    content: 'FはかつてEから「お前は神条の血を引くだけの飾りだ」と罵倒されたことがある。館への憎悪の一因だ。',
    category: 'background', relatedSlot: 'F', baseIsTrue: true,
  },
  {
    id: 'bg_008',
    content: 'EはかつてAと共に、会社の不正経理に関与したという証言がある。二人は深い共犯関係にある。',
    category: 'background', relatedSlot: 'E', baseIsTrue: true,
  },
  {
    id: 'bg_009',
    content: '海外の競売会社から神条家宛に「近日中に真作と偽作の鑑定書を送付する」という通知が来ていた。',
    category: 'background', relatedSlot: 'C', baseIsTrue: false,
  },
  {
    id: 'bg_010',
    content: 'Bと被害者は医学部の同期だったという噂がある。（実際には学校も卒業年も異なる）',
    category: 'background', relatedSlot: 'B', baseIsTrue: false,
  },
  {
    id: 'bg_011',
    content: 'Dはかつて別の館で働いており、そこで不審な死亡事故があったという話を聞いた者がいる。（無関係な話だった）',
    category: 'background', relatedSlot: 'D', baseIsTrue: false,
  },
  {
    id: 'bg_012',
    content: 'Aは事件前月、弁護士と相続に関する秘密の相談を3回行っていた。',
    category: 'background', relatedSlot: 'A', baseIsTrue: true,
  },
  {
    id: 'bg_013',
    content: 'Gは1年前まで別の名前を名乗っていた。改名の理由は「過去の清算」と本人は語る。',
    category: 'background', relatedSlot: 'G', baseIsTrue: true,
  },
  {
    id: 'bg_014',
    content: 'Fが趣味で育てる植物の中に、数種の「法的にグレーゾーン」の薬草が含まれているという情報がある。',
    category: 'background', relatedSlot: 'F', baseIsTrue: true,
  },

  // ───── 被害者情報（victim）─────
  {
    id: 'vi_001',
    content: '被害者の日記に「今夜すべてを白日のもとにさらす」と記されていた。日付は事件当日だ。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_002',
    content: '被害者は事件前夜、複数の人物に「大切な話がある」という書き置きを残していた。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_003',
    content: '被害者の机に、Bの名前が記されたメモが見つかった。「証拠は確保した」という走り書きがあった。',
    category: 'victim', relatedSlot: 'B', baseIsTrue: true,
  },
  {
    id: 'vi_004',
    content: '被害者は生前、「紫苑館には誰も知らない秘密の部屋がある」と複数の人物に話していた。',
    category: 'victim', relatedSlot: 'F', baseIsTrue: true,
  },
  {
    id: 'vi_005',
    content: '被害者の財布の中に、Aの会社への送金伝票の控えが入っていた。金額は1億円を超えていた。',
    category: 'victim', relatedSlot: 'A', baseIsTrue: false,
  },
  {
    id: 'vi_006',
    content: '被害者は2週間前、自分の遺産の配分を全面見直すと弁護士に相談していた。その理由は不明。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_007',
    content: '被害者の枕元に、意識を失いかけた状態で書いたとみられる4文字が残されていた。暗号か名前の一部か。',
    category: 'victim', relatedSlot: null, baseIsTrue: false,
  },
  {
    id: 'vi_008',
    content: '被害者は「ある人物に対して生命保険の受取人を変更する」と周囲に話していたが、実行前だったという。',
    category: 'victim', relatedSlot: 'G', baseIsTrue: true,
  },
  {
    id: 'vi_009',
    content: '被害者の部屋から、Cへの依頼書の下書きが見つかった。「偽物の証明書を用意してほしい」と書かれていた。',
    category: 'victim', relatedSlot: 'C', baseIsTrue: false,
  },
  {
    id: 'vi_010',
    content: '被害者は毎晩、就寝前に同じ銘柄のワインを1杯飲む習慣があった。使用人なら誰でも知っていた。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_org_001',
    content: '被害者の金庫に、国内外の複数の架空名義口座への送金記録が残されていた。総額は数十億円に上る。送金先の法人はいずれも実体のない幽霊会社だった。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_org_002',
    content: '被害者の手帳の最終ページに、暗号化された連絡先リストが挟まれていた。記号と数字だけで構成されており、人名は一切記されていない。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_org_003',
    content: '使用人の証言によれば、被害者は月に一度、「顔も名前も名乗らない訪問者」を深夜に書斎へ迎えていたという。その後、被害者は必ず不機嫌になっていた。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_org_004',
    content: '被害者の書斎の隠し引き出しから、「債務確認書」と題された文書が発見された。差出人の記名はなく、被害者の署名のみがある。記載された金額は法外な額だった。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_org_005',
    content: '被害者はここ数年で急激に財を成したとされるが、その事業の詳細は一切公開されていない。「本業は別にある」と被害者自身が酒席で漏らしたことがあるという証言がある。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_org_006',
    content: '被害者の携帯電話の通話記録から、登録のない番号への定期的な発信が確認された。番号の契約者は「存在しない人物」だった。（注: 記録の信憑性は未確認）',
    category: 'victim', relatedSlot: null, baseIsTrue: false,
  },
  {
    id: 'vi_fear_001',
    content: '被害者は事件の一週間前から食事を取り分けてもらい、自ら先に一口確認してから全員に出すよう指示していたという。使用人は「毒を疑っているようだった」と証言している。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_fear_002',
    content: '被害者は就寝前に必ず書斎の鍵を二重に確認し、窓の施錠を自分で確かめてから床についていた。ここ数ヶ月で始まった習慣だという。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_fear_003',
    content: '被害者は事件前夜、顧問弁護士に「もし自分に何かあれば、この封筒を開けてほしい」と手紙を預けていた。弁護士はその存在を認めたが、内容の開示を拒んでいる。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_fear_004',
    content: '被害者は「自分の命はもう長くないかもしれない」と側近に打ち明けていたという。病気の診断ではなく、「人間に殺される」という意味だったと側近は語る。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_fear_005',
    content: '被害者の日記には「今夜もまた見張られている気がする」という記述が三週間にわたって繰り返されていた。妄想か、根拠のある恐怖か。',
    category: 'victim', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'vi_fear_006',
    content: '被害者は最近になって護身用の護符を肌身離さず持つようになっていたが、事件当夜に限ってそれが部屋に残されていた。なぜ外したのかは不明だ。',
    category: 'victim', relatedSlot: null, baseIsTrue: false,
  },

  // ───── 全員無実の示唆（外部犯時のみ真）─────
  {
    id: 'innocent_A',
    content: 'T2の時刻、Aが書斎にいたことは複数の目撃証言で裏付けられている。遺言書に触れていたのは事実だが、それは犯行とは無関係だった。',
    category: 'alibi', relatedSlot: 'A', baseIsTrue: false, condition: 'outside_killer',
  },
  {
    id: 'innocent_B',
    content: 'BのT2の行動は書庫の使用記録と照合できる。カルテを持ち出していたのは確かだが、その時刻に犯行現場にいた形跡はない。',
    category: 'alibi', relatedSlot: 'B', baseIsTrue: false, condition: 'outside_killer',
  },
  {
    id: 'innocent_C',
    content: 'CはT2の時間帯、絵画室で修復作業を続けていたとみられる。名画のすり替えを試みていたが、当主の死とは直接関わっていない。',
    category: 'alibi', relatedSlot: 'C', baseIsTrue: false, condition: 'outside_killer',
  },
  {
    id: 'innocent_D',
    content: 'Dが秘密通路を使っていたことは事実だが、T2の時刻に当主の部屋へ向かった証拠はない。通路内の足跡は別の方向を示していた。',
    category: 'alibi', relatedSlot: 'D', baseIsTrue: false, condition: 'outside_killer',
  },
  {
    id: 'innocent_E',
    content: 'EはT2、金庫室に籠もって裏金の整理をしていたとみられる。金庫室の鍵の使用記録がその時刻を裏付けている。',
    category: 'alibi', relatedSlot: 'E', baseIsTrue: false, condition: 'outside_killer',
  },
  {
    id: 'innocent_F',
    content: 'FがT2に隠し部屋にいたことは、残された毒草の葉片が証明している。部屋から当主の居室へ移動する時間はなかった。',
    category: 'alibi', relatedSlot: 'F', baseIsTrue: false, condition: 'outside_killer',
  },
  {
    id: 'innocent_G',
    content: 'GはT2に書斎で権利証を探していた。書斎の乱れた形跡がその証拠だが、当主への接触はなかったと推測される。',
    category: 'alibi', relatedSlot: 'G', baseIsTrue: false, condition: 'outside_killer',
  },

  // ───── 動機（motive）─────
  {
    id: 'mo_001',
    content: 'Aは「もし父が正しい財務状況を知れば、自分は相続から外される」と兄弟の前で漏らしたことがある。',
    category: 'motive', relatedSlot: 'A', baseIsTrue: true,
  },
  {
    id: 'mo_002',
    content: 'BはT1頃、「もうこれ以上脅されることはない」と小声で呟いているのを偶然聞いた者がいる。',
    category: 'motive', relatedSlot: 'B', baseIsTrue: true,
  },
  {
    id: 'mo_003',
    content: 'Cは「この絵を世間が知ることになれば、私のキャリアは終わりだ」と知人に打ち明けていた。',
    category: 'motive', relatedSlot: 'C', baseIsTrue: true,
  },
  {
    id: 'mo_004',
    content: 'Dはかつて同僚に「いつか必ず報いを受けさせてやる」と被害者への怒りを語っていた。',
    category: 'motive', relatedSlot: 'D', baseIsTrue: true,
  },
  {
    id: 'mo_005',
    content: 'Eは退職間際に「約束の金さえ受け取れれば、こんな場所にいる必要はない」と話していた。',
    category: 'motive', relatedSlot: 'E', baseIsTrue: true,
  },
  {
    id: 'mo_006',
    content: 'Fは「廃嫡を言い渡されたその日から、俺の中で何かが終わった」と後にある人物に語った。',
    category: 'motive', relatedSlot: 'F', baseIsTrue: true,
  },
  {
    id: 'mo_007',
    content: 'Gは「私が正当な相続人だという証拠はある。ただ誰も認めようとしないだけだ」と語った。',
    category: 'motive', relatedSlot: 'G', baseIsTrue: true,
  },
  {
    id: 'mo_008',
    content: 'AとEは共に、被害者の死によって利益を得る立場にあった。二人が共謀していた可能性は否定できない。',
    category: 'motive', relatedSlot: null, baseIsTrue: false,
  },
  {
    id: 'mo_009',
    content: 'Cには海外の美術商から多額の前払い金が入っていたという噂がある。（後に確認できなかった）',
    category: 'motive', relatedSlot: 'C', baseIsTrue: false,
  },
  {
    id: 'mo_010',
    content: 'Gは「被害者が自分の存在を公表しようとしていた」と思い込んでいたが、実際は逆だったという証言がある。',
    category: 'motive', relatedSlot: 'G', baseIsTrue: false,
  },
  {
    id: 'mo_011',
    content: 'Bは事件の3日前に多額の現金を引き出していた。（その後、医療器具購入の領収書が確認された）',
    category: 'motive', relatedSlot: 'B', baseIsTrue: false,
  },
  {
    id: 'mo_012',
    content: 'Dは被害者への復讐を実行に移すための「段取り」を長年かけて準備していたという証言がある。',
    category: 'motive', relatedSlot: 'D', baseIsTrue: true,
  },

  // ───── 過去職業ヒント（background / physical / alibi）─────
  // 各キャラの隠れた過去を示唆するカード。直接明記せず断片として散りばめる。
  {
    id: 'bg_015',
    content: '神条薫はかつてヨーロッパに5年滞在していた。帰国後も骨董品に触れるとき、特有の角度から光を当てて確認する癖があると複数の人物が証言している。',
    category: 'background', relatedSlot: 'A', baseIsTrue: true,
  },
  {
    id: 'ph_019',
    content: '書斎のゴミ箱に、同じ文字を繰り返し練習した反故紙が数枚捨てられていた。署名の練習のようにも見える。',
    category: 'physical', relatedSlot: 'A', baseIsTrue: true,
  },
  {
    id: 'bg_016',
    content: '白川医師が医師免許を取得したのは35歳のときだという。それ以前の10年間のキャリアについては一切語らず、話題を変えようとする。',
    category: 'background', relatedSlot: 'B', baseIsTrue: true,
  },
  {
    id: 'al_015',
    content: '白川は夕食の席で、処方箋に載っていない薬品名を流暢に並べていた。同席した者は「あれは臨床医の知識ではない」と感じたという。',
    category: 'alibi', relatedSlot: 'B', baseIsTrue: true,
  },
  {
    id: 'bg_017',
    content: '氷室涼子は酒の席で「若い頃は芸能関係の仕事をしていた」と笑いながら漏らしたことがある。詳細は語らなかった。',
    category: 'background', relatedSlot: 'C', baseIsTrue: true,
  },
  {
    id: 'ph_020',
    content: '氷室の荷物の中に、絵画修復とは無関係の特殊メイク用品と、人毛を使ったウィッグが収められていた。',
    category: 'physical', relatedSlot: 'C', baseIsTrue: true,
  },
  {
    id: 'al_016',
    content: '小夜は古い南京錠を手に取り、一瞬眺めただけで音もなく開けてしまった。見ていた若いメイドを驚かせたが、小夜本人は何も言わなかった。',
    category: 'alibi', relatedSlot: 'D', baseIsTrue: true,
  },
  {
    id: 'bg_018',
    content: '館に来る前の小夜の経歴を知る者は誰もいない。採用時の身元保証人も今では連絡が取れなくなっている。',
    category: 'background', relatedSlot: 'D', baseIsTrue: true,
  },
  {
    id: 'al_017',
    content: '黒部はワインを一口含んだだけで産地と収穫年を言い当てた。驚いて尋ねた者に「以前の仕事の名残です」とだけ答えた。',
    category: 'alibi', relatedSlot: 'E', baseIsTrue: true,
  },
  {
    id: 'bg_019',
    content: '黒部が神条家に仕える前、都内のどこかの一流ホテルにいたという噂がある。本人は否定も肯定もしない。',
    category: 'background', relatedSlot: 'E', baseIsTrue: true,
  },
  {
    id: 'al_018',
    content: '蓮がロープの結び目を確かめるとき、庭師とは思えない鮮やかな手つきだった。まるで舞台や演技で慣れ親しんだような身のこなしだった。',
    category: 'alibi', relatedSlot: 'F', baseIsTrue: true,
  },
  {
    id: 'bg_020',
    content: '神条蓮が家を出てからの数年間、一切の消息が途絶えていた。帰国後に「各地を転々とした」と言うだけで、詳細は決して語らない。',
    category: 'background', relatedSlot: 'F', baseIsTrue: true,
  },
  {
    id: 'al_019',
    content: '綾小路麗華は自分の出身地について、昨日と今日で微妙に違う説明をしていた。気づいた者が問い詰めると自然に話題を変えた。',
    category: 'alibi', relatedSlot: 'G', baseIsTrue: true,
  },
  {
    id: 'ph_021',
    content: '麗華の客間のゴミ箱に、用途不明の封蝋の欠片と、異なるインクで書かれた数枚の下書きが捨てられていた。',
    category: 'physical', relatedSlot: 'G', baseIsTrue: true,
  },
  {
    id: 'te_013',
    content: '筆跡鑑定の専門家によると、遺言書の一部の文字はインクの乾き具合が他の箇所と微妙に異なる。後から書き加えた可能性がある。',
    category: 'technical', relatedSlot: 'A', baseIsTrue: true,
  },
  {
    id: 'ph_026',
    content: '白川の往診カバンの奥に、医療現場では使わない化学系の試薬名が書かれたメモが挟まれていた。',
    category: 'physical', relatedSlot: 'B', baseIsTrue: true,
  },
  {
    id: 'ps_018',
    content: '氷室は夕食の席で、立ち上がるたびに身のこなしが変わる瞬間があった。舞台に立ち慣れた者特有の、重心の切り替えに見えた。',
    category: 'psychology', relatedSlot: 'C', baseIsTrue: true,
  },
  {
    id: 'bg_025',
    content: '小夜が鍵束を管理する方法は独特で、錠前ごとに素材と構造を書いたメモを添えている。趣味の域を超えた几帳面さだ。',
    category: 'background', relatedSlot: 'D', baseIsTrue: true,
  },
  {
    id: 'vi_011',
    content: '被害者の寝室のグラスに残っていたワインを調べると、通常の銘柄と異なる微量成分が検出された。飲み残しは一口分だった。',
    category: 'victim', relatedSlot: 'E', baseIsTrue: true,
  },
  {
    id: 'ps_019',
    content: '蓮は狭い通路を通るとき、肩をすくめる前に一瞬だけ体の向きを確認してから通り抜けた。身体訓練を受けた者の癖に見えた。',
    category: 'psychology', relatedSlot: 'F', baseIsTrue: true,
  },

  // ───── 過去職業ミスリード（別キャラへの疑惑誘導）─────
  {
    id: 'bg_021',
    content: '黒部はかつて劇団に所属していたことがあるという噂がある。変装が得意だと言う者もいる。（確認は取れていない）',
    category: 'background', relatedSlot: 'E', baseIsTrue: false,
  },
  {
    id: 'ph_022',
    content: 'Fの庭仕事用の道具箱に、場違いなマジック用トランプが混入していた。（植物の押し花を挟む台紙に使っていた）',
    category: 'physical', relatedSlot: 'F', baseIsTrue: false,
  },
  {
    id: 'bg_022',
    content: 'Aは若い頃に美術学校に通っていたという話がある。絵画の模写を繰り返していたと同期生が証言した。',
    category: 'background', relatedSlot: 'A', baseIsTrue: false,
  },
  {
    id: 'ph_023',
    content: 'BのカバンにE向けと思われる未開封の酒瓶が入っていた。ラベルに手書きの文字がある。（実際は贈り物用だった）',
    category: 'physical', relatedSlot: 'B', baseIsTrue: false,
  },
  {
    id: 'al_020',
    content: 'T2頃、絵画室のあたりで黒部に似た人物が廊下をうろついているのを見た。（暗くて顔まではわからなかった）',
    category: 'alibi', relatedSlot: 'E', baseIsTrue: false,
  },
  {
    id: 'al_021',
    content: '氷室は「ワインの味の変化には敏感なんです」と笑いながら話していた。専門家並みの知識を披露した。',
    category: 'alibi', relatedSlot: 'C', baseIsTrue: false,
  },
  {
    id: 'ph_024',
    content: '小夜の私物の引き出しに、封蝋の道具と見知らぬ家紋の印章が隠されていた。（館の調度品を修繕するための備品だった）',
    category: 'physical', relatedSlot: 'D', baseIsTrue: false,
  },
  {
    id: 'bg_023',
    content: '蓮はかつて海外の醸造所で働いていたことがあると言われる。植物の発酵・蒸留に詳しいという話が出回っている。',
    category: 'background', relatedSlot: 'F', baseIsTrue: false,
  },
  {
    id: 'ps_015',
    content: 'Eは被害者のワインを注ぐとき、わずかに手元を隠すような動きをしていたと複数の者が証言している。',
    category: 'psychology', relatedSlot: 'E', baseIsTrue: false,
  },
  {
    id: 'ps_017',
    content: '小夜は被害者のそばでワインのデキャンタを扱うとき、液体の色をやけに注意深く観察していた。',
    category: 'psychology', relatedSlot: 'D', baseIsTrue: false,
  },

  // ───── 技術情報（technical）─────
  {
    id: 'te_001',
    content: '問題の毒草から抽出したエキスは、ワインに溶かすと無色・無臭で検出が極めて困難とされる。',
    category: 'technical', relatedSlot: 'F', baseIsTrue: true,
  },
  {
    id: 'te_002',
    content: '睡眠薬の過剰投与は、老人の自然死と酷似した症状を引き起こす。専門知識がなければ判別できない。',
    category: 'technical', relatedSlot: 'B', baseIsTrue: true,
  },
  {
    id: 'te_003',
    content: '館の設計図によると、書斎と図書室の間には外部からは見えない「通気口」があり、声が筒抜けになる。',
    category: 'technical', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'te_004',
    content: '秘密通路は館の地図には記載されていないが、旧式の設計書には存在が確認できる。出入口は少なくとも3箇所。',
    category: 'technical', relatedSlot: 'D', baseIsTrue: true,
  },
  {
    id: 'te_005',
    content: '金庫の鍵は2種類あり、1本は主人が、もう1本は執事が管理している。複製は不可能な特殊構造だ。',
    category: 'technical', relatedSlot: 'E', baseIsTrue: true,
  },
  {
    id: 'te_006',
    content: '被害者の部屋の扉は内側からしか施錠できない。外から鍵をかけるには、特殊な工具が必要だ。',
    category: 'technical', relatedSlot: null, baseIsTrue: true,
  },
  {
    id: 'te_007',
    content: '精巧な油絵の複製には通常6〜12ヶ月を要するが、特殊な技法を使えば2週間以内に仕上げられる。',
    category: 'technical', relatedSlot: 'C', baseIsTrue: true,
  },
  {
    id: 'te_008',
    content: '問題の毒草の毒性は、葉を素手で長時間触れ続けることでも皮膚から吸収される可能性がある。',
    category: 'technical', relatedSlot: 'F', baseIsTrue: false,
  },
  {
    id: 'te_009',
    content: '館の電話線は吹雪の前夜に切断されていたが、屋外設備の自然故障とも区別がつかない状況だった。',
    category: 'technical', relatedSlot: null, baseIsTrue: false,
  },
  {
    id: 'te_010',
    content: '館の時計は事件当夜から2分ずれていたという報告がある。（後に電池切れと判明）',
    category: 'technical', relatedSlot: null, baseIsTrue: false,
  },
  {
    id: 'te_011',
    content: '旧式の遺言書は、目撃者なしに書き換えると法的効力を失う場合がある。ただし発覚しなければ問題ない。',
    category: 'technical', relatedSlot: 'A', baseIsTrue: true,
  },
  {
    id: 'te_012',
    content: '絵画の偽作鑑定には特殊な蛍光灯照射検査が必要で、肉眼では本物と見分けがつかないケースが多い。',
    category: 'technical', relatedSlot: 'C', baseIsTrue: true,
  },
]

export function getTemplateById(id: string): CardTemplate | undefined {
  return CARD_TEMPLATES.find(t => t.id === id)
}
