import * as THREE from 'three'
import fieldVert from './shaders/logoField.vert.glsl?raw'
import fieldFrag from './shaders/logoField.frag.glsl?raw'

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

  const markWidth = mark.offsetWidth
  const offsetX = centerX - markWidth / 2
  mark.style.transform = `translateX(${-offsetX * 0.5}px)`
}

async function loadSvgTexture(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`SVG non trovato (${response.status})`)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = objectUrl
    await image.decode()

    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight

    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true

    return texture
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function createFieldShaderRenderer(container) {
  let animationId = 0
  let running = true

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  })
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.className = 'logoIntro__field-canvas'
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uFieldMap: { value: null },
      uTime: { value: 0 },
      uPulseSpeed: { value: 0.38 },
      uFieldCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uAspect: { value: new THREE.Vector2(1, 1) }
    },
    vertexShader: fieldVert,
    fragmentShader: fieldFrag,
    transparent: true,
    depthWrite: false,
    depthTest: false
  })

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))

  function resize() {
    const width = Math.max(container.clientWidth, 1)
    const height = Math.max(container.clientHeight, 1)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height, false)
    material.uniforms.uAspect.value.set(width / height, 1)
  }

  function animate(time) {
    if (!running) return
    material.uniforms.uTime.value = time * 0.001
    renderer.render(scene, camera)
    animationId = requestAnimationFrame(animate)
  }

  resize()
  animationId = requestAnimationFrame(animate)

  return {
    setTexture(texture) {
      material.uniforms.uFieldMap.value = texture
    },
    resize,
    destroy() {
      running = false
      cancelAnimationFrame(animationId)
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }
}

async function setupMagneticFieldShader(container, mark) {
  try {
    const texture = await loadSvgTexture(`${import.meta.env.BASE_URL}assets/disegno-logo.svg`)
    const fieldRenderer = createFieldShaderRenderer(container)
    fieldRenderer.setTexture(texture)
    fieldRenderer.resize()
    positionMagneticField(mark)

    return fieldRenderer
  } catch (error) {
    console.error('Campo magnetico non caricato:', error)
    return null
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
  const fieldContainer = overlay.querySelector('.logoIntro__field')
  let fieldRenderer = null

  setupMagneticFieldShader(fieldContainer, mark).then((renderer) => {
    fieldRenderer = renderer
  })

  const reposition = () => {
    positionMagneticField(mark)
    fieldRenderer?.resize()
  }

  window.addEventListener('resize', reposition)
  document.fonts?.ready.then(reposition)

  return {
    overlay,
    setAboutMode(active) {
      overlay.classList.toggle('logoIntro--about-open', active)
      mark.classList.toggle('logoIntro__mark--hidden', active)
    },
    destroy() {
      window.removeEventListener('resize', reposition)
      fieldRenderer?.destroy()
    }
  }
}

export function runLogoIntro({ logoIntro, stage, onStart }) {
  const overlay = logoIntro.overlay
  const button = overlay.querySelector('.logoIntro__button')
  let started = false

  button.addEventListener('click', async () => {
    if (started) return
    started = true
    button.disabled = true

    overlay.classList.add('logoIntro--fade-out')
    stage.classList.remove('experience-stage--blurred')

    await waitForTransition(overlay, FADE_MS)
    logoIntro.destroy()
    overlay.remove()
    await onStart()
  })
}
