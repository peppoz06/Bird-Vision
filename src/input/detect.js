// Sceglie l'esperienza mobile solo se il dispositivo ha puntatore "coarse",
// touch e supporto all'orientamento (bussola/giroscopio). Cosi laptop touch
// con mouse preciso restano in modalita desktop.
export function isMobileExperience() {
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const noHover = window.matchMedia('(hover: none)').matches
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const hasOrientation = 'DeviceOrientationEvent' in window

  return coarsePointer && noHover && hasTouch && hasOrientation
}
