export const characterIds = ['dishes', 'ingredients', 'cooking', 'laundry'] as const;
export type CharacterId = typeof characterIds[number];
export const characters = {
 dishes: {
  name:'あわもん', english:'AWAMON', task:'食器洗い', action:'食器を洗う', completed:'食器を洗いました', unit:'しずく', place:'池', nav:'わたしの池', day:'ひだまりの池', night:'月あかりの池',
  asset:'awamon', scene:'awamon-pond', description:'食器を洗って、水の妖精と池を育てよう。',
  worlds:['はじまりの水たまり','ちいさな池','みどりの池','花咲く池','なかまたちの池'],
  forms:['あわのこ','めばえ','ふたば','はなかんむり','池のまもりびと'],
  beforeTitle:'洗う前を、パシャリ。', beforeHint:'食器全体が入るように、明るい場所で撮ろう。', afterTitle:'きれいになったら、もう1枚。', afterHint:'洗った食器が見えるように、なるべく同じ角度で。',
  finish:'洗い終わった！ 写真を撮る', confirm:'洗いました！ 完了を記録', catchphrase:'洗うたび、池にしずく。', reward:'きみのひと洗いが、池のうるおいになりました。', thanks:'きれいにしてくれて、ありがとう。',
 },
 ingredients: {
  name:'べじもん', english:'VEGIMON', task:'食材活用', action:'冷蔵庫の食材を使う', completed:'食材を使いました', unit:'たね', place:'キッチン菜園', nav:'わたしの菜園', day:'ひだまりの菜園', night:'夜のキッチン菜園',
  asset:'ingredients', scene:'ingredients-world', description:'冷蔵庫の食材をおいしく使って、野菜の妖精を育てよう。',
  worlds:['はじまりの食材コーナー','芽ぶくキッチン','ハーブのある台所','花咲くキッチン菜園','実りのキッチン菜園'],
  forms:['ちびにんじん','わかば','葉っぱのマフラー','花飾りベジ','実りのまもりびと'],
  beforeTitle:'使う食材を、パシャリ。', beforeHint:'冷蔵庫などから、今日使う食材を取り出して撮ろう。', afterTitle:'おいしく使えたら、もう1枚。', afterHint:'使った食材が分かる料理や調理後の様子を撮ろう。',
  finish:'食材を使えた！ 写真を撮る', confirm:'食材を使いました！ 記録する', catchphrase:'使いきるたび、菜園にたね。', reward:'食材を大切に使った記録が、菜園の実りになりました。', thanks:'おいしく使ってくれて、ありがとう。',
 },
 cooking: {
  name:'なべもん', english:'NABEMON', task:'料理', action:'料理をする', completed:'料理を作りました', unit:'おいしさ', place:'台所', nav:'わたしの台所', day:'ぬくもりの台所', night:'夜のほっこり台所',
  asset:'cooking', scene:'cooking-world', description:'ひと品作って、小さなホーロー鍋の妖精を育てよう。',
  worlds:['ちいさな台所','木べらのある台所','道具がそろう台所','ごちそうの台所','なかまと囲む台所'],
  forms:['こなべ','木べらのおとも','見習いシェフ','おめかしシェフ','ごちそうシェフ'],
  beforeTitle:'料理の準備を、パシャリ。', beforeHint:'今日作る料理の材料や、調理の準備を撮ろう。', afterTitle:'できあがりを、パシャリ。', afterHint:'作った料理が見えるように撮ろう。小さなひと品でも大丈夫。',
  finish:'料理できた！ 写真を撮る', confirm:'料理を作りました！ 記録する', catchphrase:'ひと品できると、台所が育つ。', reward:'きみのひと品が、台所のぬくもりになりました。', thanks:'作ってくれて、ありがとう。',
 },
 laundry: {
  name:'ひなたもん', english:'HINATAMON', task:'洗濯・干す', action:'洗濯して干す', completed:'洗濯して干しました', unit:'ひかり', place:'ベランダ', nav:'わたしのベランダ', day:'そよ風のベランダ', night:'星あかりのベランダ',
  asset:'laundry', scene:'laundry-world', description:'洗濯して干すと、おひさまの妖精とベランダが育つよ。',
  worlds:['ちいさな物干し場','タオルのあるベランダ','風の通るベランダ','花咲くベランダ','雲のなかまと暮らす庭'],
  forms:['こひなた','雲のマフラー','にじのリボン','お花のひなた','おひさまの王冠'],
  beforeTitle:'洗濯するものを、パシャリ。', beforeHint:'洗う衣類やタオルを撮ろう。個人情報の写り込みに気をつけてね。', afterTitle:'干せたら、もう1枚。', afterHint:'干した洗濯物を撮ろう。室内干しでも大丈夫。',
  finish:'干せた！ 写真を撮る', confirm:'洗濯して干しました！ 記録する', catchphrase:'干せたら、ベランダにひかり。', reward:'洗濯を終えた記録が、ベランダのひかりになりました。', thanks:'干してくれて、ありがとう。',
 },
};
