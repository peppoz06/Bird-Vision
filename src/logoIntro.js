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

function positionMagneticField(mark) {
  const field = mark.querySelector('.logoIntro__field')
  const y = mark.querySelector('.logoIntro__letter--y')
  const four = mark.querySelector('.logoIntro__letter--four')

  if (!field || !y || !four) return

  const markRect = mark.getBoundingClientRect()
  const yRect = y.getBoundingClientRect()
  const fourRect = four.getBoundingClientRect()

  const centerX = (yRect.right + fourRect.left) / 2 - markRect.left
  const centerY = yRect.top + yRect.height / 2 - markRect.top

  field.style.left = `${centerX}px`
  field.style.top = `${centerY}px`
}

async function loadMagneticField(container, mark) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}assets/disegno-logo.svg`)

    if (!response.ok) {
      throw new Error(`SVG non trovato (${response.status})`)
    }

    const svgText = await response.text()
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
    const svg = doc.querySelector('svg')

    if (!svg) {
      throw new Error('SVG non valido')
    }

    svg.classList.add('logoIntro__svg')
    svg.setAttribute('role', 'presentation')
    svg.setAttribute('aria-hidden', 'true')
    svg.removeAttribute('width')
    svg.removeAttribute('height')
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

    const paths = svg.querySelectorAll('path')
    paths.forEach((path, index) => {
      path.setAttribute('fill', 'currentColor')
      path.classList.add('logoIntro__path')
      path.style.animationDelay = `${(index % 16) * 0.22}s`
    })

    container.appendChild(svg)
    positionMagneticField(mark)
  } catch (error) {
    console.error('Campo magnetico non caricato:', error)
  }
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
          <span class="logoIntro__gap" aria-hidden="true"></span>
          <span class="logoIntro__letter logoIntro__letter--four">4</span>
        </span>
      </span>
    </button>
  `

  document.body.appendChild(overlay)

  const mark = overlay.querySelector('.logoIntro__mark')
  loadMagneticField(overlay.querySelector('.logoIntro__field'), mark)

  const reposition = () => positionMagneticField(mark)
  window.addEventListener('resize', reposition)
  document.fonts?.ready.then(reposition)

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
