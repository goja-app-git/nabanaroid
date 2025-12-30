export function shuffled(list){
  const a = Array.isArray(list) ? [...list] : [];
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normOne(kind, p){
  if (!p) return null;
  const s = String(p).trim();

  // すでにURL/絶対/./img/ ならそのまま
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/") || s.startsWith("./img/") || s.startsWith("img/")){
    return s;
  }

  // "./idle/xxx" など
  if (s.startsWith("./")) {
    const t = s.slice(2);
    // "./idle/xxx" → "./img/idle/xxx"
    return `./img/${t}`;
  }

  // "idle/xxx" など
  if (s.includes("/")){
    return `./img/${s}`;
  }

  // ファイル名だけ → kindフォルダ扱い
  return `./img/${kind}/${s}`;
}

export async function loadImageManifest(url){
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`manifest_fetch_${res.status}`);

  const j = await res.json();

  const idle  = (Array.isArray(j.idle)  ? j.idle  : []).map(x => normOne("idle", x)).filter(Boolean);
  const angry = (Array.isArray(j.angry) ? j.angry : []).map(x => normOne("angry", x)).filter(Boolean);
  const nabana= (Array.isArray(j.nabana)? j.nabana: []).map(x => normOne("nabana", x)).filter(Boolean);

  return { idle, angry, nabana };
}