import * as THREE from 'three'
import logoFieldVert from './shaders/logoField.vert.glsl?raw'
import logoFieldFrag from './shaders/logoField.frag.glsl?raw'

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

async function loadMaskTexture(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`SVG non trovato (${response.status})`)
  }

  const svgText = await response.text()
  const blob = new Blob([svgText], { type: 'image/svg+xml' })
  const blobUrl = URL.createObjectURL(blob)

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('SVG non caricato come immagine'))
      img.src = blobUrl
    })

    const texture = new THREE.Texture(image)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true

    return {
      texture,
      width: image.naturalWidth || 736,
      height: image.naturalHeight || 1168
    }
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

async function createLogoField(container) {
  const { texture, width, height } = await loadMaskTexture(
    `${import.meta.env.BASE_URL}assets/disegno-logo.svg`
  )

  const texAspect = width / height

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    premultipliedAlpha: false
  })
  renderer.setClearColor(0x000000, 0)

  const canvas = renderer.domElement
  canvas.className = 'logoIntro__canvas'
  container.appendChild(canvas)

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const uniforms = {
    uMask: { value: texture },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uFit: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 }
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: logoFieldVert,
    fragmentShader: logoFieldFrag,
    transparent: true,
    depthTest: false,
    depthWrite: false
  })

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))

  function resize() {
    const rect = container.getBoundingClientRect()
    const w = Math.max(1, rect.width)
    const h = Math.max(1, rect.height)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    renderer.setPixelRatio(dpr)
    renderer.setSize(w, h, false)

    uniforms.uResolution.value.set(w * dpr, h * dpr)

    const canvasAspect = w / h
    if (texAspect > canvasAspect) {
      uniforms.uFit.value.set(1, canvasAspect / texAspect)
    } else {
      uniforms.uFit.value.set(texAspect / canvasAspect, 1)
    }
  }

  resize()

  let raf = 0
  const start = performance.now()

  function animate() {
    uniforms.uTime.value = (performance.now() - start) * 0.001
    renderer.render(scene, camera)
    raf = requestAnimationFrame(animate)
  }

  animate()

  return {
    resize,
    dispose() {
      cancelAnimationFrame(raf)
      material.dispose()
      texture.dispose()
      renderer.dispose()
      canvas.remove()
    }
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
  const field = overlay.querySelector('.logoIntro__field')
  let fieldController = null

  const reposition = () => {
    positionMagneticField(mark)
    fieldController?.resize()
  }

  createLogoField(field)
    .then((controller) => {
      fieldController = controller
      reposition()
    })
    .catch((error) => {
      console.error('Campo magnetico non caricato:', error)
    })

  reposition()

  window.addEventListener('resize', reposition)
  document.fonts?.ready.then(reposition)

  overlay._disposeField = () => fieldController?.dispose()

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
    overlay._disposeField?.()
    overlay.remove()
    await onStart()
  })
}
