export async function loadImageManifest(url){
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("manifest_fetch_failed");
  const j = await res.json();

  // 期待: { idle:[...], angry:[...], nabana:[...] }
  const idle = Array.isArray(j.idle) ? j.idle : [];
  const angry = Array.isArray(j.angry) ? j.angry : [];
  const nabana = Array.isArray(j.nabana) ? j.nabana : [];

  return { idle, angry, nabana };
}

export function pickRandom(list){
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}