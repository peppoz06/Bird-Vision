import './style.css'
import * as THREE from 'three'
import { setupWebcam } from './webcam/webcam.js'
import { isMobileExperience } from './input/detect.js'
import { setupDesktopInput } from './input/desktop.js'
import { requestOrientationPermission, startCompass } from './input/mobile.js'
import vertexShader from './shaders/vertex.glsl?raw'
import fragmentShader from './shaders/fragment.glsl?raw'

function setupShaderHotReload(material) {
  if (!import.meta.hot) return

  import.meta.hot.accept('./shaders/vertex.glsl?raw', (module) => {
    material.vertexShader = module.default
    material.needsUpdate = true
  })

  import.meta.hot.accept('./shaders/fragment.glsl?raw', (module) => {
    material.fragmentShader = module.default
    material.needsUpdate = true
  })
}

function createScene() {
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  const uniforms = {
    uWebcam: { value: null },
    uMouse: {
      value: new THREE.Vector2(
        window.innerWidth * 0.5,
        window.innerHeight * 0.5
      )
    },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    uTime: { value: 0 },
    uFlipX: { value: 1 },
    uNorthStrength: { value: 1 }
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader
  })

  setupShaderHotReload(material)

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  scene.add(plane)

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
  })

  return { scene, camera, renderer, uniforms }
}

// Overlay con pulsante: serve a iOS per i permessi (bussola) e in generale
// a sbloccare camera/GPS con un gesto utente.
function showStartOverlay(label) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'start-overlay'

    const button = document.createElement('button')
    button.className = 'start-button'
    button.textContent = label

    button.addEventListener('click', () => {
      overlay.remove()
      resolve()
    })

    overlay.appendChild(button)
    document.body.appendChild(overlay)
  })
}

async function init() {
  const { scene, camera, renderer, uniforms } = createScene()

  // Punto "nord" verso cui lo shader si illumina; viene interpolato dolcemente.
  const targetNorth = new THREE.Vector2(
    uniforms.uMouse.value.x,
    uniforms.uMouse.value.y
  )
  // Intensita dell'alone (1 = pieno, 0 = assente). Su desktop sempre 1.
  let targetStrength = 1
  const setNorth = (x, y, strength = 1) => {
    targetNorth.set(x, y)
    targetStrength = strength
  }

  if (isMobileExperience()) {
    await showStartOverlay('Avvia esperienza')

    try {
      await requestOrientationPermission()
    } catch (err) {
      console.warn(err)
    }

    const video = await setupWebcam({ facingMode: 'environment' })
    uniforms.uWebcam.value = new THREE.VideoTexture(video)
    uniforms.uFlipX.value = 0 // camera posteriore: nessun mirror

    startCompass(setNorth)
  } else {
    const video = await setupWebcam()
    uniforms.uWebcam.value = new THREE.VideoTexture(video)
    uniforms.uFlipX.value = 1 // camera frontale: effetto specchio

    setupDesktopInput(setNorth)
  }

  function animate(time) {
    uniforms.uTime.value = time * 0.001
    uniforms.uMouse.value.lerp(targetNorth, 0.12)
    uniforms.uNorthStrength.value +=
      (targetStrength - uniforms.uNorthStrength.value) * 0.1

    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }

  animate()
}

init()
