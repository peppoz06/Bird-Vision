// Converte un heading bussola (gradi, 0 = nord, orario) nel punto schermo
// che lo shader usa come "nord". heading 0 => nord davanti (in alto);
// ruotando in senso orario il punto nord scivola verso sinistra.
export function headingToScreen(headingDeg, width, height) {
  const rad = (headingDeg * Math.PI) / 180
  const cx = width * 0.5
  const cy = height * 0.5
  const radius = Math.min(width, height) * 0.42

  const x = cx - Math.sin(rad) * radius
  const y = cy + Math.cos(rad) * radius

  return { x, y }
}
