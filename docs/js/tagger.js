function grams2(s){
  const t = (s || "").toLowerCase().replace(/\s+/g,"");
  const out = [];
  for (let i=0;i<t.length-1;i++){
    out.push(t.slice(i,i+2));
  }
  return out;
}

function freqMap(arr){
  const m = new Map();
  for (const x of arr){
    m.set(x, (m.get(x)||0)+1);
  }
  return m;
}

function cosineSim(aMap, bMap){
  let dot = 0;
  let a2 = 0;
  let b2 = 0;

  for (const [k, va] of aMap){
    a2 += va*va;
    const vb = bMap.get(k) || 0;
    dot += va*vb;
  }
  for (const [, vb] of bMap){
    b2 += vb*vb;
  }
  if (a2 === 0 || b2 === 0) return 0;
  return dot / (Math.sqrt(a2) * Math.sqrt(b2));
}

function bestScoreForTag(text, examples){
  const gText = freqMap(grams2(text));
  let best = 0;
  for (const ex of examples){
    const gEx = freqMap(grams2(ex));
    const s = cosineSim(gText, gEx);
    if (s > best) best = s;
  }
  return best;
}

export function inferTags(text, CFG){
  const scores = [];
  for (const [tag, examples] of Object.entries(CFG.TAG_EXAMPLES)){
    if (!examples || examples.length === 0) continue;
    const s = bestScoreForTag(text, examples);
    scores.push({ tag, score: s });
  }
  scores.sort((a,b)=>b.score-a.score);

  const top = scores.slice(0, CFG.TAGS_PER_ITEM);
  const tags = top.map(x=>x.tag);
  const conf = top.length ? top[0].score : 0;

  const domain = CFG.DOMAIN_OF_TAG[tags[0]] || "other";
  return { tags, conf, domain, debug: top };
}