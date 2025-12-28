export const TAG_EXAMPLES = {
  light_meal: ["あっさり", "軽め", "うどん", "そば", "サラダ"],
  heavy_meal: ["こってり", "ガッツリ", "二郎", "家系", "焼肉", "カレー"],
  warm: ["温かい", "あったかい", "鍋", "ラーメン", "温泉"],
  cold: ["冷たい", "アイス", "冷やし", "そうめん"],
  healthy: ["ヘルシー", "野菜", "低カロリー", "健康"],
  junk: ["背徳", "ジャンク", "油", "チート", "ポテト"],

  fast: ["早い", "最短", "急ぐ", "すぐ", "時短", "新幹線"],
  slow: ["ゆっくり", "のんびり", "寄り道", "散歩"],
  short_move: ["近い", "徒歩", "近場", "すぐそこ"],
  long_move: ["遠い", "ドライブ", "旅行", "移動してでも"],

  indoor: ["屋内", "室内", "インドア", "カフェ", "映画"],
  outdoor: ["屋外", "外", "アウトドア", "キャンプ", "釣り"],

  cheap: ["安い", "節約", "コスパ"],
  luxury: ["高い", "贅沢", "ご褒美", "いい宿"],

  stable: ["無難", "安心", "いつもの"],
  adventure: ["挑戦", "新規", "冒険", "開拓"]
};

export const TAG_DOMAIN = {
  light_meal:"food", heavy_meal:"food", warm:"food", cold:"food", healthy:"food", junk:"food",
  fast:"move", slow:"move", short_move:"move", long_move:"move",
  indoor:"place", outdoor:"place",
  cheap:"money", luxury:"money",
  stable:"risk", adventure:"risk"
};

function bigrams(s){
  const t = (s || "").toLowerCase().replace(/\s+/g, "");
  const arr = [];
  for(let i=0;i<Math.max(0,t.length-1);i++) arr.push(t.slice(i,i+2));
  return arr;
}
function cosineLike(a, b){
  if (!a.length || !b.length) return 0;
  const ma = new Map();
  for (const x of a) ma.set(x, (ma.get(x)||0)+1);
  const mb = new Map();
  for (const x of b) mb.set(x, (mb.get(x)||0)+1);

  let dot = 0, na = 0, nb = 0;
  for (const [k,va] of ma.entries()){
    na += va*va;
    dot += va*(mb.get(k)||0);
  }
  for (const vb of mb.values()) nb += vb*vb;
  if (na===0 || nb===0) return 0;
  return dot / Math.sqrt(na*nb);
}

function dominantDomain(tags){
  const cnt = new Map();
  for (const t of tags){
    const d = TAG_DOMAIN[t] || "other";
    cnt.set(d, (cnt.get(d)||0)+1);
  }
  let bestD="other", best=0;
  for (const [d,c] of cnt.entries()){
    if (c > best){ best = c; bestD = d; }
  }
  return bestD;
}

export function inferTags(text, topK=5){
  const bg = bigrams(text);
  const scores = [];

  for (const [tag, exs] of Object.entries(TAG_EXAMPLES)){
    let best = 0;
    for (const ex of exs){
      const sc = cosineLike(bg, bigrams(ex));
      if (sc > best) best = sc;
    }
    scores.push([tag, best]);
  }

  scores.sort((a,b)=>b[1]-a[1]);
  const picked = scores.slice(0, topK).filter(x=>x[1] > 0);
  const tags = picked.map(x=>x[0]);
  const conf = picked.length ? picked[0][1] : 0;
  const domain = dominantDomain(tags);

  return { tags, conf, domain };
}