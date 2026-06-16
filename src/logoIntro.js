const FADE_MS = 1000

function waitForTransition(el, ms) {
  return new Promise((resolve) => {
    let done = false

    const finish = () => {
      if (done) return
      done = true
      el.removeEventListener('transitionend', onEnd)
      resolve()
    }

    const onEnd = (event) => {
      if (event.target === el && event.propertyName === 'opacity') {
        finish()
      }
    }

    el.addEventListener('transitionend', onEnd)
    window.setTimeout(finish, ms + 50)
  })
}

async function loadMagneticField(container) {
  const response = await fetch(`${import.meta.env.BASE_URL}assets/disegno-logo.svg`)
  const svgText = await response.text()
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const svg = doc.querySelector('svg')

  if (!svg) return

  svg.classList.add('logoIntro__svg')
  svg.setAttribute('role', 'presentation')
  svg.setAttribute('aria-hidden', 'true')

  const paths = svg.querySelectorAll('path')
  paths.forEach((path, index) => {
    path.setAttribute('fill', 'currentColor')
    path.classList.add('logoIntro__path')
    path.style.animationDelay = `${(index % 12) * 0.35}s`
  })

  container.appendChild(svg)
}

export function createLogoIntro() {
  const overlay = document.createElement('div')
  overlay.className = 'logoIntro'
  overlay.id = 'logoIntro'

  overlay.innerHTML = `
    <button type="button" class="logoIntro__button" aria-label="Avvia esperienza">
      <span class="logoIntro__mark">
        <span class="logoIntro__field" aria-hidden="true"></span>
        <span class="logoIntro__text">
          <span class="logoIntro__letter">C</span>
          <span class="logoIntro__letter">R</span>
          <span class="logoIntro__letter logoIntro__letter--y">Y</span>
          <span class="logoIntro__letter logoIntro__letter--four">4</span>
        </span>
      </span>
    </button>
  `

  document.body.appendChild(overlay)
  loadMagneticField(overlay.querySelector('.logoIntro__field'))

  return overlay
}

export function runLogoIntro({ overlay, stage, onStart }) {
  const button = overlay.querySelector('.logoIntro__button')
  let started = false

  button.addEventListener('click', async () => {
    if (started) return
    started = true
    button.disabled = true

    overlay.classList.add('logoIntro--fade-out')
    stage.classList.remove('experience-stage--blurred')

    await waitForTransition(overlay, FADE_MS)
    overlay.remove()
    await onStart()
  })
}
