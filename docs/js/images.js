export function safeUrl(p){
  return encodeURI(String(p));
}

function normalizePath(p){
  if (!p) return null;
  const s = String(p).trim();

  // すでに img/ を含む、またはURLならそのまま
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("./img/") || s.startsWith("img/")) {
    return s;
  }

  // manifest.json内で "./idle/xxx" のように書いてもOKにする
  if (s.startsWith("./idle/")) return "./img/" + s.slice(2);
  if (s.startsWith("idle/"))   return "./img/" + s;

  if (s.startsWith("./angry/")) return "./img/" + s.slice(2);
  if (s.startsWith("angry/"))   return "./img/" + s;

  if (s.startsWith("./nabana/")) return "./img/" + s.slice(2);
  if (s.startsWith("nabana/"))   return "./img/" + s;

  return s;
}

export async function loadImageManifest(url){
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("manifest_fetch_failed");
  const j = await res.json();

  const idle = (Array.isArray(j.idle) ? j.idle : []).map(normalizePath).filter(Boolean);
  const angry = (Array.isArray(j.angry) ? j.angry : []).map(normalizePath).filter(Boolean);
  const nabana = (Array.isArray(j.nabana) ? j.nabana : []).map(normalizePath).filter(Boolean);

  return { idle, angry, nabana };
}

export function shuffled(list){
  const a = Array.isArray(list) ? [...list] : [];
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}