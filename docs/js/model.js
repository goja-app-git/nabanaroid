export function decideWithModel(payload, tagsA, tagsB){
  // payload想定： { weights: { tag: number, ... }, bias?: number }
  const w = payload?.weights || {};
  const bias = Number(payload?.bias || 0);

  const score = (tags) => {
    let s = bias;
    for (const t of tags){
      s += Number(w[t] || 0);
    }
    return s;
  };

  const a = score(tagsA);
  const b = score(tagsB);

  // 同点はA優先
  return { pickA: a >= b, scoreA: a, scoreB: b };
}