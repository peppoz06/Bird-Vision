import geomagnetism from 'geomagnetism'

// Declinazione magnetica (gradi) per convertire nord magnetico in nord vero:
// nordVero = nordMagnetico + declinazione.
// Se il modello non e disponibile (o la data e fuori range) si ripiega su 0,
// cioe si resta sul nord magnetico.
export function getDeclination(lat, lon) {
  try {
    const info = geomagnetism.model().point([lat, lon])
    return info.decl
  } catch (err) {
    console.warn('Declinazione non disponibile, uso il nord magnetico.', err)
    return 0
  }
}
