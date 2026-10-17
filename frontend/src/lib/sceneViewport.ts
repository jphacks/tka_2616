/** Match pixel-anims integer scaling and asymmetric integer centering exactly. */
export function sceneInsets(width: number, height: number): string {
  if (width <= 0 || height <= 0) return 'inset(0)';
  const scale = Math.max(1, Math.floor(Math.min(width / 160, height / 96)));
  const left = Math.max(0, (width - 160 * scale) >> 1);
  const top = Math.max(0, (height - 96 * scale) >> 1);
  const right = Math.max(0, width - 160 * scale - left);
  const bottom = Math.max(0, height - 96 * scale - top);
  return `inset(${top / height * 100}% ${right / width * 100}% ${bottom / height * 100}% ${left / width * 100}%)`;
}
