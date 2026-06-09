import { getDeclination } from './declination.js'
import { headingToScreen } from './heading.js'

// Chiede il permesso per l'orientamento (necessario su iOS 13+). Va invocata
// da un gesto utente (es. tap su un pulsante).
export async function requestOrientationPermission() {
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    const result = await DeviceOrientationEvent.requestPermission()
    if (result !== 'granted') {
      throw new Error('Permesso bussola negato')
    }
  }
}

// Avvia bussola + GPS. Chiama onNorth(x, y) in pixel ad ogni aggiornamento.
export function startCompass(onNorth) {
  let declination = 0

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        declination = getDeclination(
          pos.coords.latitude,
          pos.coords.longitude
        )
      },
      (err) => console.warn('GPS non disponibile, uso il nord magnetico.', err),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handle = (e) => {
    let magnetic = null

    if (typeof e.webkitCompassHeading === 'number') {
      // iOS: gia heading bussola orario da nord
      magnetic = e.webkitCompassHeading
    } else if (e.absolute && typeof e.alpha === 'number') {
      // Android/standard: alpha antiorario => converto in heading orario
      magnetic = (360 - e.alpha) % 360
    }

    if (magnetic == null) return

    const screenAngle =
      (screen.orientation && screen.orientation.angle) || 0

    const trueHeading = (magnetic + declination + screenAngle + 360) % 360

    const { x, y } = headingToScreen(
      trueHeading,
      window.innerWidth,
      window.innerHeight
    )

    onNorth(x, y)
  }

  // Preferisci l'evento assoluto (heading reale) quando disponibile.
  if ('ondeviceorientationabsolute' in window) {
    window.addEventListener('deviceorientationabsolute', handle)
  } else {
    window.addEventListener('deviceorientation', handle)
  }
}
