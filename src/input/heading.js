// Trasforma l'heading bussola (gradi, 0 = nord, orario) in un indicatore di
// direzione del nord per lo shader:
//  - x: dove si trova il nord sullo schermo
//      nord davanti  -> centro
//      est (90)      -> bordo sinistro (il nord e a sinistra)
//      ovest (-90)   -> bordo destro
//      sud (180)     -> fuori schermo
//  - strength: allineamento bussola (1 = nord, 0 = sud/oposto)
//      nord -> calma e alone al centro
//      sud -> agitazione punti (direzione errata), immagine resta leggibile
export function northIndicator(headingDeg, width, height) {
  // delta in [-180, 180]: scarto angolare rispetto al nord
  const delta = ((((headingDeg + 180) % 360) + 360) % 360) - 180
  const deltaRad = (delta * Math.PI) / 180

  // 90 gradi di scarto portano l'alone sul bordo schermo
  const maxAngle = 90
  const offset = delta / maxAngle

  const x = width * 0.5 - offset * width * 0.5
  const y = height * 0.5

  const strength = Math.max(0, 0.5 + 0.5 * Math.cos(deltaRad))

  return { x, y, strength }
}
