const ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export function digitsToB64u(d) {
  if (d.length % 2 !== 0) throw new Error("bad_len");
  let out = "";
  for (let i = 0; i < d.length; i += 2) {
    const idx = parseInt(d.slice(i, i + 2), 10);
    if (!(idx >= 0 && idx < 64)) throw new Error("bad_digit");
    out += ALPH[idx];
  }
  return out;
}