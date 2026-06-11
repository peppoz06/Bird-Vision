import './style.css'
import * as THREE from 'three'
import { setupWebcam } from './webcam/webcam.js'
import { isMobileExperience } from './input/detect.js'
import { setupDesktopInput } from './input/desktop.js'
import { requestOrientationPermission, startCompass } from './input/mobile.js'
import { buildShader } from './shaders/buildShader.js'
import fullscreenVert from './shaders/vertex.glsl?raw'
import depthFrag from './shaders/depth.frag.glsl?raw'
import depthRefineFrag from './shaders/depthRefine.frag.glsl?raw'
import pointCloudVert from './shaders/pointCloud.vert.glsl?raw'
import pointCloudFrag from './shaders/pointCloud.frag.glsl?raw'

const DEPTH_W = 640
const DEPTH_H = 480

function getGridSize(mobile) {
  return mobile ? { w: 220, h: 165 } : { w: 360, h: 270 }
}

function createRenderTarget(w, h) {
  return new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    depthBuffer: false
  })
}

function createFullscreenPass(fragmentShader, uniforms, { shared = false } = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: fullscreenVert,
    fragmentShader: shared ? buildShader(fragmentShader) : fragmentShader
  })

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  const scene = new THREE.Scene()
  scene.add(mesh)

  return {
    scene,
    camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    material,
    uniforms: material.uniforms
  }
}

function createPointCloud(gridW, gridH, uniforms, aspect) {
  const count = gridW * gridH
  const positions = new Float32Array(count * 3)
  const pointUvs = new Float32Array(count * 2)

  const spanX = 1.9 * aspect
  const spanY = 1.9

  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const i = y * gridW + x
      const u = x / (gridW - 1)
      const v = 1.0 - y / (gridH - 1)

      positions[i * 3] = (u - 0.5) * spanX
      positions[i * 3 + 1] = (v - 0.5) * spanY
      positions[i * 3 + 2] = 0.0

      pointUvs[i * 2] = u
      pointUvs[i * 2 + 1] = v
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('pointUv', new THREE.BufferAttribute(pointUvs, 2))

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: buildShader(pointCloudVert),
    fragmentShader: buildShader(pointCloudFrag),
    transparent: true,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending
  })

  return new THREE.Points(geometry, material)
}

function setupShaderHotReload(pointMaterial) {
  if (!import.meta.hot) return

  import.meta.hot.accept('./shaders/pointCloud.vert.glsl?raw', (module) => {
    pointMaterial.vertexShader = buildShader(module.default)
    pointMaterial.needsUpdate = true
  })

  import.meta.hot.accept('./shaders/pointCloud.frag.glsl?raw', (module) => {
    pointMaterial.fragmentShader = buildShader(module.default)
    pointMaterial.needsUpdate = true
  })
}

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
  const mobile = isMobileExperience()
  const { w: gridW, h: gridH } = getGridSize(mobile)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000000, 1)
  document.body.appendChild(renderer.domElement)

  const aspect = window.innerWidth / window.innerHeight
  const camera = new THREE.PerspectiveCamera(50, aspect, 0.01, 8)
  camera.position.set(0, 0, 1.18)

  const scene = new THREE.Scene()

  const sharedUniforms = {
    uWebcam: { value: null },
    uDepth: { value: null },
    uMouse: {
      value: new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5)
    },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    uTime: { value: 0 },
    uFlipX: { value: 1 },
    uNorthStrength: { value: 1 },
    uPointScale: { value: mobile ? 1.0 : 1.25 },
    uDepthScale: { value: 0.95 },
    uGridSize: { value: new THREE.Vector2(gridW, gridH) }
  }

  const depthRawTarget = createRenderTarget(DEPTH_W, DEPTH_H)
  const depthRefinedTarget = createRenderTarget(DEPTH_W, DEPTH_H)
  const depthPrevTarget = createRenderTarget(DEPTH_W, DEPTH_H)
  const prevFrameTarget = createRenderTarget(DEPTH_W, DEPTH_H)

  const texelSize = new THREE.Vector2(1 / DEPTH_W, 1 / DEPTH_H)

  const depthPass = createFullscreenPass(depthFrag, {
    uWebcam: sharedUniforms.uWebcam,
    uPrevFrame: { value: prevFrameTarget.texture },
    uFlipX: sharedUniforms.uFlipX,
    uTexelSize: { value: texelSize }
  })

  const depthRefinePass = createFullscreenPass(depthRefineFrag, {
    uDepthRaw: { value: depthRawTarget.texture },
    uDepthPrev: { value: depthPrevTarget.texture },
    uWebcam: sharedUniforms.uWebcam,
    uFlipX: sharedUniforms.uFlipX,
    uTexelSize: { value: texelSize }
  })

  const copyPass = createFullscreenPass(
    `
    uniform sampler2D uSource;
    varying vec2 vUv;
    void main() {
      gl_FragColor = texture2D(uSource, vUv);
    }
    `,
    { uSource: { value: null } }
  )

  sharedUniforms.uDepth.value = depthRefinedTarget.texture

  const points = createPointCloud(gridW, gridH, sharedUniforms, aspect)
  scene.add(points)

  setupShaderHotReload(points.material)

  const targetNorth = new THREE.Vector2(
    sharedUniforms.uMouse.value.x,
    sharedUniforms.uMouse.value.y
  )
  let targetStrength = 1
  const setNorth = (x, y, strength = 1) => {
    targetNorth.set(x, y)
    targetStrength = strength
  }

  if (mobile) {
    await showStartOverlay('Avvia esperienza')

    try {
      await requestOrientationPermission()
    } catch (err) {
      console.warn(err)
    }

    const video = await setupWebcam({ facingMode: 'environment' })
    sharedUniforms.uWebcam.value = new THREE.VideoTexture(video)
    sharedUniforms.uWebcam.value.minFilter = THREE.LinearFilter
    sharedUniforms.uWebcam.value.magFilter = THREE.LinearFilter
    sharedUniforms.uFlipX.value = 0

    startCompass(setNorth)
  } else {
    const video = await setupWebcam()
    sharedUniforms.uWebcam.value = new THREE.VideoTexture(video)
    sharedUniforms.uWebcam.value.minFilter = THREE.LinearFilter
    sharedUniforms.uWebcam.value.magFilter = THREE.LinearFilter
    sharedUniforms.uFlipX.value = 1

    setupDesktopInput(setNorth)
  }

  window.addEventListener('resize', () => {
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    sharedUniforms.uResolution.value.set(w, h)
  })

  function renderPass(pass, target) {
    renderer.setRenderTarget(target)
    renderer.render(pass.scene, pass.camera)
  }

  function animate(time) {
    const t = time * 0.001
    sharedUniforms.uTime.value = t
    sharedUniforms.uMouse.value.lerp(targetNorth, 0.12)
    sharedUniforms.uNorthStrength.value +=
      (targetStrength - sharedUniforms.uNorthStrength.value) * 0.1

    if (sharedUniforms.uWebcam.value) {
      sharedUniforms.uWebcam.value.needsUpdate = true

      // Pass 1: stima profondita multi-segnale
      renderPass(depthPass, depthRawTarget)

      // Pass 2: raffinamento edge-aware + stabilizzazione temporale
      renderPass(depthRefinePass, depthRefinedTarget)

      // Pass 3: point cloud 3D
      renderer.setRenderTarget(null)
      renderer.render(scene, camera)

      // Aggiorna buffer temporali per il frame successivo
      copyPass.uniforms.uSource.value = depthRefinedTarget.texture
      renderPass(copyPass, depthPrevTarget)

      copyPass.uniforms.uSource.value = sharedUniforms.uWebcam.value
      renderPass(copyPass, prevFrameTarget)
    }

    requestAnimationFrame(animate)
  }

  animate()
}

init()
