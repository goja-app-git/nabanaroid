function sigmoid(x){
  if (x > 20) x = 20;
  if (x < -20) x = -20;
  return 1 / (1 + Math.exp(-x));
}

export function decideWithModel(payload, tagsA, tagsB){
  const w = payload?.model?.w || {};
  const bias = payload?.model?.bias || 0;

  let s = bias;
  for (const t of tagsA) s += (w[t] || 0);
  for (const t of tagsB) s -= (w[t] || 0);

  const pA = sigmoid(s);
  return { pickA: pA >= 0.5, pA };
}