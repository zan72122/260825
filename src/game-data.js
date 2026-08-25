export const PROCESS_STATES=[
  {name:'原木',group:'木地',detail:'木目と乾燥状態を見て木を選ぶ。'},
  {name:'椀木取り',group:'木地',detail:'年輪に沿って椀の荒型を取る。'},
  {name:'燻煙・乾燥',group:'木地',detail:'急がず、ゆがみを落ち着かせる。'},
  {name:'荒挽き',group:'木地',detail:'完成形より大きく、削り代を残す。'},
  {name:'外挽き',group:'木地',detail:'外側の曲率と口縁を整える。'},
  {name:'内挽き',group:'木地',detail:'内側を挽き、肉厚をそろえる。'},
  {name:'底挽き',group:'木地',detail:'高台と接地を作る。'},
  {name:'刻苧',group:'下地',detail:'亀裂を切り開き、漆の充填材で直す。'},
  {name:'木地磨き',group:'下地',detail:'毛羽と刃跡を落とす。'},
  {name:'木地固め',group:'下地',detail:'生漆を木へ含浸させる。'},
  {name:'布着せ',group:'下地',detail:'口縁・底などを麻布で補強する。'},
  {name:'布削り',group:'下地',detail:'布目と重なりの段差を削る。'},
  {name:'惣身',group:'下地',detail:'布と木地の段差を漆で埋める。'},
  {name:'一辺地付け',group:'下地',detail:'粗い地の粉を含む下地を押し付ける。'},
  {name:'一辺地研ぎ',group:'下地',detail:'高い所から研ぎ、形を戻す。'},
  {name:'二辺地付け',group:'下地',detail:'中粒の下地で凹凸を小さくする。'},
  {name:'二辺地研ぎ',group:'下地',detail:'水と砥石で面をそろえる。'},
  {name:'三辺地付け',group:'下地',detail:'細粒の下地で滑らかにする。'},
  {name:'三辺地研ぎ',group:'下地',detail:'上塗につながる曲率へ整える。'},
  {name:'地固め',group:'下地',detail:'生漆を擦り込み、下地を締める。'},
  {name:'中塗',group:'塗り',detail:'下地全体へ薄い漆を塗る。'},
  {name:'中塗研ぎ',group:'塗り',detail:'水研ぎで刷毛目とふしを探す。'},
  {name:'錆さらい',group:'塗り',detail:'凹みへ錆漆を詰め、平らにする。'},
  {name:'小中塗',group:'塗り',detail:'薄く再塗装し、面をつなぐ。'},
  {name:'小中塗研ぎ',group:'塗り',detail:'上塗前の最終研ぎをする。'},
  {name:'上塗',group:'塗り',detail:'清浄な部屋で、長い刷毛を一方向へ運ぶ。'},
  {name:'塗師風呂',group:'硬化',detail:'湿度を保つ陰室で漆を硬化させる。'},
  {name:'呂色研ぎ',group:'仕上げ',detail:'上塗面を極細に研ぐ。'},
  {name:'摺り漆・艶上げ',group:'仕上げ',detail:'摺り漆と磨きを重ねて艶を深くする。'},
  {name:'沈金',group:'加飾',detail:'漆面を彫り、溝へ金を入れる。'},
  {name:'蒔絵',group:'加飾',detail:'漆で描き、半乾きの線へ金粉を蒔く。'},
  {name:'検品・完成',group:'完成',detail:'斜光、合口、接地、艶を確かめる。'},
];

const step=(id,title,detail,icon,mode,target=1,extra={})=>({id,title,detail,icon,mode,target,...extra});

export const CHAPTERS=[
  {
    id:0,number:'01',group:'木地づくり',title:'木をえらぶ',short:'木を選ぶ',scene:'wood-choice',states:[0,1,2],
    steps:[step('choose-wood','木を えらんでね','大きな木を、ぽんとタッチ。','☝','choice',1,{choice:'wood'})],
    auto:{title:'木を、ゆっくり乾かします。',detail:'燻煙と乾燥で、ゆがみが落ち着くまで待ちます。',duration:5200},
    complete:{title:'木が 目をさましました',detail:'乾いた木の中に、うつわの形が待っています。'}
  },
  {
    id:1,number:'02',group:'木地づくり',title:'ろくろで挽く',short:'ろくろ',scene:'lathe',states:[3,4,5,6],
    steps:[
      step('lathe-rough','よこへ 何度も なぞろう','木が回るあいだ、鉋をゆっくり送ります。','↔','swipe-x',8),
      step('lathe-inside','うちがわを けずろう','短い往復で、厚みをそろえます。','↔','swipe-x',7,{zone:'upper'}),
      step('lathe-foot','下を まるく ととのえよう','高台が机へきちんと座る形にします。','↔','swipe-x',5,{zone:'lower'})
    ],
    auto:{title:'職人が、厚みを確かめます。',detail:'口縁、高台、内外の曲率を見て、わずかな刃跡を整えます。',duration:3800},
    complete:{title:'木のうつわが できました',detail:'次は、小さな割れを見つけて直します。'}
  },
  {
    id:2,number:'03',group:'下地づくり',title:'割れをなおす',short:'刻苧',scene:'repair',states:[7],
    steps:[
      step('find-crack','割れを みつけよう','黒い細い線を、ぽんとタッチ。','☝','tap-target',1),
      step('open-crack','線にそって なぞろう','傷を隠さず、充填材が入る形へ開きます。','⌁','trace',1,{trace:'crack'}),
      step('fill-crack','へらで うめよう','端から端へ、刻苧を押し込みます。','▰','swipe-x',6,{zone:'middle'})
    ],
    auto:{title:'刻苧が、木と一つになります。',detail:'余分を削り、乾いてから面をもう一度そろえます。',duration:3300},
    complete:{title:'割れが つよく なりました',detail:'表面だけでなく、傷の奥から直しました。'}
  },
  {
    id:3,number:'04',group:'下地づくり',title:'木を磨き、固める',short:'木地固め',scene:'hardening',states:[8,9],
    steps:[
      step('sand-wood','くるくる みがこう','木の毛羽と刃跡を、円を描いて落とします。','○','circle',4),
      step('raw-lacquer','上から下へ ぬろう','生漆を薄く含ませ、木の中まで守ります。','↓','swipe-y',7)
    ],
    auto:{title:'生漆が、木の中へ入ります。',detail:'余分を拭き、湿度のある場所でゆっくり硬化させます。',duration:3500},
    complete:{title:'木が しまって きました',detail:'次は、弱い場所へ布を着せます。'}
  },
  {
    id:4,number:'05',group:'下地づくり',title:'布を着せる',short:'布着せ',scene:'cloth',states:[10],
    steps:[
      step('drag-cloth','布を うつわへ はこぼう','大きな布をつかみ、口の近くへ動かします。','☝','drag',1,{drag:'cloth'}),
      step('press-cloth','まんなかから 外へ おそう','空気を追い出し、布を木へ密着させます。','↗','radial',8)
    ],
    auto:{title:'布の重なりを、職人が整えます。',detail:'織り方向と重なり幅を確かめ、余分な漆を拭きます。',duration:3200},
    complete:{title:'うつわに 布のよろい',detail:'壊れやすい口と底が、ぐっと強くなりました。'}
  },
  {
    id:5,number:'06',group:'下地づくり',title:'布を削り、段差を埋める',short:'布削り・惣身',scene:'cloth-trim',states:[11,12],
    steps:[
      step('trim-cloth','ふちにそって なぞろう','小刀で、はみ出した布だけを切ります。','⌁','trace',1,{trace:'rim'}),
      step('somi','へらで 面を つなごう','布と木の段差へ漆を押し込みます。','↔','swipe-x',7)
    ],
    auto:{title:'布目が、なだらかな面になります。',detail:'乾いた後、削ってもう一度曲率を確かめます。',duration:3300},
    complete:{title:'布と木が 一つの面に',detail:'ここから、輪島地の粉の層を重ねます。'}
  },
  {
    id:6,number:'07',group:'下地づくり',title:'地の粉を混ぜる',short:'地の粉',scene:'mix',states:[],
    steps:[
      step('pour-lacquer','生漆を そそごう','器をタッチして、必要な分だけ入れます。','◒','tap-repeat',3,{ingredient:'lacquer'}),
      step('pour-paste','米糊を いれよう','粘りをつなぐ米糊を加えます。','◒','tap-repeat',2,{ingredient:'paste'}),
      step('pour-powder','地の粉を いれよう','粗い輪島地の粉を、こぼさず加えます。','◒','tap-repeat',3,{ingredient:'powder'}),
      step('stir-base','大きく くるくる まぜよう','粉のかたまりが消えるまで混ぜます。','○','circle',6)
    ],
    auto:{title:'硬さを、へらの跡で確かめます。',detail:'塗る場所に合わせ、漆・米糊・地の粉の具合を整えます。',duration:3000},
    complete:{title:'つよい下地が できました',detail:'粗い層から細かい層へ、三回重ねます。'}
  },
  {
    id:7,number:'08',group:'下地づくり',title:'三つの地を付ける',short:'三層の地付け',scene:'layers',states:[13,15,17],
    steps:[
      step('coat-coarse','一辺地を 押しつけよう','粗い粒を、へらで強く押し送ります。','▰','swipe-x',8,{layer:'coarse'}),
      step('coat-medium','二辺地を 重ねよう','中くらいの粒で、凹凸を小さくします。','▰','swipe-x',8,{layer:'medium'}),
      step('coat-fine','三辺地を 重ねよう','細かな粒で、滑らかな面へ近づけます。','▰','swipe-x',8,{layer:'fine'})
    ],
    auto:{title:'塗って、乾かし、軽く研ぎます。',detail:'同じ一回ではありません。粒の違う三層を順番に重ねます。',duration:4300},
    complete:{title:'三つの土の層が できました',detail:'見えない骨格が、うつわを長く支えます。'}
  },
  {
    id:8,number:'09',group:'下地づくり',title:'水で研ぐ',short:'地研ぎ',scene:'sanding',states:[14,16,18,19],
    steps:[
      step('add-water','水を ひとしずく','砥石と下地が乾かないよう、水を加えます。','●','tap-repeat',2),
      step('sand-ground','ひろく 往復しよう','高い所から曇り、最後に面がそろいます。','↔','swipe-free',12),
      step('harden-ground','漆を すりこもう','研いだ下地へ生漆を薄く含ませます。','○','circle',4)
    ],
    auto:{title:'研ぎ泥を洗い、形を測ります。',detail:'口縁の厚み、高台の接地、内外の曲率を見直します。',duration:3700},
    complete:{title:'面が まっすぐ つながりました',detail:'次は、黒い中塗で下地全体を覆います。'}
  },
  {
    id:9,number:'10',group:'塗り',title:'中塗と錆さらい',short:'中塗',scene:'middle-coat',states:[20,21,22,23,24],
    steps:[
      step('middle-coat','長く まっすぐ ぬろう','中塗漆を薄く、同じ向きへ運びます。','↓','swipe-y',8),
      step('find-pits','小さな へこみを 見つけよう','斜めの光で見える三つのへこみをタッチ。','☝','tap-spots',3),
      step('fill-pits','錆漆を うめよう','へらで小さく押し、面から出ないようにします。','▰','tap-repeat',3)
    ],
    auto:{title:'小中塗と研ぎを、もう一度。',detail:'薄く塗り、乾かし、研ぎ、上塗前の面を清めます。',duration:4300},
    complete:{title:'黒い面が つながりました',detail:'次はいよいよ、仕上がりを決める上塗です。'}
  },
  {
    id:10,number:'11',group:'塗り',title:'上塗する',short:'上塗',scene:'top-coat',states:[25],
    steps:[
      step('clean-room','ほこりを そっと はらおう','紙と作業台を静かに払います。','↗','swipe-free',5,{zone:'table'}),
      step('top-inside','内側を 一息で ぬろう','途中で戻らず、口から底へ長く運びます。','↓','long-stroke',5,{surface:'inside'}),
      step('top-outside','外側も 一息で ぬろう','重なりを少なく、同じ方向へそろえます。','↓','long-stroke',6,{surface:'outside'})
    ],
    auto:{title:'塗り終えた器を、すぐ陰室へ。',detail:'流れが偏らないよう、しばらくゆっくり回します。',duration:3200},
    complete:{title:'深い黒が うまれました',detail:'漆は熱風ではなく、湿度の中で硬くなります。'}
  },
  {
    id:11,number:'12',group:'硬化',title:'塗師風呂で待つ',short:'塗師風呂',scene:'furo',states:[26],
    steps:[
      step('place-furo','うつわを 棚へ はこぼう','両手は使わず、大きくつかんで棚へ動かします。','☝','drag',1,{drag:'bowl'}),
      step('humidity','しつどを 80 にしよう','丸い目盛りを、ゆっくり右へ回します。','◔','dial',.8),
      step('rotate-bowl','うつわを ゆっくり 回そう','横へなぞり、漆が片側へ流れないようにします。','↔','swipe-x',6)
    ],
    auto:{title:'暗く湿った棚で、漆が硬化します。',detail:'時間が進み、赤褐色の漆が深い黒へ変わっていきます。',duration:5600},
    complete:{title:'漆が しっかり 硬くなりました',detail:'ここから磨くと、光が深く映ります。'}
  },
  {
    id:12,number:'13',group:'仕上げ',title:'呂色で磨く',short:'呂色',scene:'roiro',states:[27,28],
    steps:[
      step('roiro-sand','炭で こまかく 研ごう','小さな円を重ね、上塗面を均一に曇らせます。','○','circle',6),
      step('surigushi','漆を うすく すりこもう','指先ではなく、柔らかな道具で薄く広げます。','○','circle',4),
      step('polish','光が つながるまで みがこう','反射の帯が切れなくなるまで往復します。','↔','swipe-free',12)
    ],
    auto:{title:'摺り漆と艶上げを、静かに重ねます。',detail:'一度で鏡面にせず、薄い層と磨きを繰り返します。',duration:4200},
    complete:{title:'光が うつわの中へ 入りました',detail:'最後に、沈金か蒔絵で物語を入れます。'}
  },
  {
    id:13,number:'14',group:'加飾',title:'金の文様を入れる',short:'沈金・蒔絵',scene:'decoration',states:[29,30],
    steps:[
      step('choose-decoration','やり方を えらぼう','彫って金を入れる沈金、描いて粉を蒔く蒔絵。','☝','choice',1,{choice:'decoration'}),
      step('draw-decoration','波の線を なぞろう','ゆっくりで大丈夫。線の近くへ道具が吸いつきます。','⌁','trace',1,{trace:'wave'}),
      step('gold-decoration','金を そっと 入れよう','漆のある場所だけへ、金が残ります。','✦','sprinkle',8)
    ],
    auto:{title:'余分な金を払い、文様を定着させます。',detail:'沈金は溝へ、蒔絵は描いた漆の線へ金が残ります。',duration:3600},
    complete:{title:'能登の波が きらめきました',detail:'黄色い線ではなく、金属の粉が光を返します。'}
  },
  {
    id:14,number:'15',group:'完成',title:'検品して箱へ',short:'検品',scene:'inspection',states:[31],
    steps:[
      step('rotate-inspect','うつわを 一周 まわそう','横へなぞり、光の帯と口の形を確かめます。','↻','rotate',1),
      step('inspect-points','三つを たしかめよう','口、艶、高台を順番にタッチします。','☝','tap-spots',3,{inspection:true}),
      step('box-bowl','木箱へ そっと おこう','うつわを大きくつかみ、箱の中へ運びます。','☝','drag',1,{drag:'box'})
    ],
    auto:{title:'布で包み、工程帳を添えます。',detail:'使い、直し、受け継ぐ時間が、最後の「＋1」の工程です。',duration:4000},
    complete:{title:'あなたの輪島塗が 完成しました',detail:'見えない層も、触った跡も、全部この器の中にあります。'}
  }
];


const AUTO_BEATS=[
  [
    {at:0,title:'椀の荒型を取ります。',detail:'年輪の向きを見て、完成形より大きく切り出します。'},
    {at:.32,title:'煙で、ゆっくり水分を抜きます。',detail:'急な乾燥を避け、木の動きを落ち着かせます。'},
    {at:.7,title:'季節をまたいで乾かします。',detail:'挽いた後にゆがみにくい木地へ整えます。'}
  ],
  [
    {at:0,title:'口縁と肉厚を測ります。',detail:'外側だけでなく、内側との距離を確かめます。'},
    {at:.38,title:'刃跡を、ほんの少し整えます。',detail:'削り過ぎず、設計した曲率へ近づけます。'},
    {at:.72,title:'高台の座りを確かめます。',detail:'机へ置き、傾きとがたつきを見ます。'}
  ],
  [
    {at:0,title:'刻苧を、傷の奥で硬化させます。',detail:'表面だけを隠さず、充填材を木と一体にします。'},
    {at:.48,title:'余分な刻苧を削ります。',detail:'器の曲面から出た部分だけを取り除きます。'},
    {at:.76,title:'修理した面を確かめます。',detail:'指先と斜光で、段差が残っていないか見ます。'}
  ],
  [
    {at:0,title:'余分な生漆を拭き取ります。',detail:'厚い膜を残さず、木の中へ入った漆を生かします。'},
    {at:.4,title:'湿度のある陰室へ入れます。',detail:'熱風ではなく、湿度の中で漆を硬化させます。'},
    {at:.76,title:'木地が、きゅっと締まります。',detail:'毛羽を確かめ、次の布着せへ備えます。'}
  ],
  [
    {at:0,title:'布の重なり幅をそろえます。',detail:'織り方向と口縁の位置を見直します。'},
    {at:.42,title:'余分な漆と空気を追い出します。',detail:'布が浮かないよう、中心から外へ押さえます。'},
    {at:.78,title:'布が木地へ密着しました。',detail:'硬化後に削れる、安定した補強層になります。'}
  ],
  [
    {at:0,title:'惣身漆を硬化させます。',detail:'布目と木地の段差を埋めたまま、静かに待ちます。'},
    {at:.46,title:'布目の高い所を削ります。',detail:'補強を失わない範囲で、表面だけを整えます。'},
    {at:.78,title:'器の曲率へ戻します。',detail:'下地を重ねる前に、口から高台までつなげます。'}
  ],
  [
    {at:0,title:'へらの跡で、硬さを見ます。',detail:'流れ過ぎず、固過ぎない下地へ調整します。'},
    {at:.45,title:'粒のかたまりをつぶします。',detail:'漆、米糊、地の粉をむらなくつなげます。'},
    {at:.78,title:'一辺地の分を取り分けます。',detail:'塗る場所と粒の粗さに合わせて準備します。'}
  ],
  [
    {at:0,title:'一辺地を硬化させ、軽く研ぎます。',detail:'粗い粒で骨格を作り、高い所だけを落とします。'},
    {at:.35,title:'二辺地を硬化させ、また研ぎます。',detail:'中粒の層で、凹凸をさらに小さくします。'},
    {at:.7,title:'三辺地を硬化させ、面を整えます。',detail:'細粒の層を、上塗へつながる曲率に戻します。'}
  ],
  [
    {at:0,title:'研ぎ泥を、きれいに洗います。',detail:'砥粒と削れた下地を、面へ残しません。'},
    {at:.4,title:'口縁と高台を測ります。',detail:'厚み、傾き、接地をもう一度確かめます。'},
    {at:.75,title:'地固めの漆を硬化させます。',detail:'研いだ下地へ生漆を含ませ、層を締めます。'}
  ],
  [
    {at:0,title:'中塗を湿度の中で硬化させます。',detail:'刷毛目と塵が見える、連続した漆面になります。'},
    {at:.34,title:'中塗を水研ぎします。',detail:'ふしと高い所を探し、平らな面へ戻します。'},
    {at:.68,title:'小中塗と研ぎを、もう一度。',detail:'薄く塗り、硬化させ、上塗前の面を清めます。'}
  ],
  [
    {at:0,title:'上塗の肌を、斜めの光で見ます。',detail:'塵、垂れ、刷毛目がないか、その場で確かめます。'},
    {at:.38,title:'器をゆっくり回します。',detail:'柔らかい漆が片側へ流れないよう、姿勢を変えます。'},
    {at:.76,title:'塗師風呂へ運びます。',detail:'触れず、埃を避け、湿度のある棚へ移します。'}
  ],
  [
    {at:0,title:'棚の湿度を保ちます。',detail:'水分を補い、漆が反応できる環境を作ります。'},
    {at:.34,title:'器をゆっくり回します。',detail:'液垂れを防ぎ、膜厚が偏らないようにします。'},
    {at:.7,title:'暗い棚で、漆が硬化します。',detail:'赤褐色の濡れた面が、深い黒へ落ち着きます。'}
  ],
  [
    {at:0,title:'ごく薄い摺り漆を重ねます。',detail:'磨いた面へ漆を擦り込み、余分を拭き取ります。'},
    {at:.38,title:'薄い漆を硬化させます。',detail:'一度で鏡面にせず、待つ工程を挟みます。'},
    {at:.72,title:'艶上げを、静かに繰り返します。',detail:'反射の帯が切れずにつながるまで磨きます。'}
  ],
  [
    {at:0,title:'余分な金を、柔らかく払います。',detail:'沈金は溝へ、蒔絵は描いた漆へだけ金を残します。'},
    {at:.42,title:'金と漆を定着させます。',detail:'触れずに硬化させ、文様を漆面へ固定します。'},
    {at:.76,title:'表面をやさしく整えます。',detail:'金属の粒が、光源を受けて静かに返ります。'}
  ],
  [
    {at:0,title:'斜光で、艶と塵を検査します。',detail:'器を一周させ、反射の乱れを探します。'},
    {at:.36,title:'口縁、高台、接地を確かめます。',detail:'寸法とがたつき、手に持った感触を見ます。'},
    {at:.72,title:'布で包み、工程帳を添えます。',detail:'使い、直し、受け継ぐ時間が最後の工程になります。'}
  ]
];

CHAPTERS.forEach((chapter,index)=>{chapter.auto.beats=AUTO_BEATS[index]||[];});

export const WOOD_CHOICES=[
  {id:'keyaki',name:'ケヤキ',detail:'木目が力強く、堅い木。',color:'#8b5a2f'},
  {id:'katsura',name:'カツラ',detail:'きめが細かく、挽きやすい木。',color:'#aa7648'},
  {id:'hiba',name:'ヒバ',detail:'香りがあり、軽やかな木。',color:'#b08a5c'},
];

export const DECORATION_CHOICES=[
  {id:'chinkin',name:'沈金',detail:'線を彫り、溝へ金を入れる。',color:'#c99a3e'},
  {id:'makie',name:'蒔絵',detail:'漆で描き、金粉を蒔く。',color:'#d8b15b'},
];

export function statesThroughChapter(chapterIndex){
  const set=new Set();
  for(let i=0;i<=chapterIndex&&i<CHAPTERS.length;i++)for(const state of CHAPTERS[i].states)set.add(state);
  return [...set].sort((a,b)=>a-b);
}
