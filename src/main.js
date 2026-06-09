import './style.css'
import * as THREE from 'three'
import { setupWebcam } from './webcam/webcam.js'
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

async function init() {
  const video = await setupWebcam()

  const scene = new THREE.Scene()

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  const webcamTexture = new THREE.VideoTexture(video)

  const uniforms = {
    uWebcam: { value: webcamTexture },

    uMouse: {
      value: new THREE.Vector2(
        window.innerWidth * 0.5,
        window.innerHeight * 0.5
      )
    },

    uResolution: {
      value: new THREE.Vector2(
        window.innerWidth,
        window.innerHeight
      )
    },

    uTime: { value: 0 }
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader
  })

  setupShaderHotReload(material)

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    material
  )

  scene.add(plane)

  window.addEventListener('mousemove', (e) => {
    uniforms.uMouse.value.set(
      e.clientX,
      window.innerHeight - e.clientY
    )
  })

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight)

    uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight
    )
  })

  function animate(time) {
    uniforms.uTime.value = time * 0.001

    renderer.render(scene, camera)

    requestAnimationFrame(animate)
  }

  animate()
}

init()
