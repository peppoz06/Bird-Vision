// Input desktop: il mouse definisce il punto "nord" che lo shader illumina.
export function setupDesktopInput(onNorth) {
  window.addEventListener('mousemove', (e) => {
    onNorth(e.clientX, window.innerHeight - e.clientY)
  })
}
