export function initAbout({ onOpen, onClose } = {}) {
  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'about-toggle about-toggle--hidden'
  toggle.textContent = 'ABOUT'
  toggle.setAttribute('aria-expanded', 'false')
  toggle.setAttribute('aria-controls', 'about-panel')

  const panel = document.createElement('aside')
  panel.id = 'about-panel'
  panel.className = 'about-panel'
  panel.setAttribute('aria-hidden', 'true')
  panel.innerHTML = `
    <button type="button" class="about-panel__close" aria-label="Close About panel">×</button>
    <div class="about-panel__inner">
      <h1 class="about-panel__title">
        An artistic exploration of avian magnetoreception
      </h1>

      <section class="about-panel__section">
        <h2 class="about-panel__heading">The phenomenon</h2>
        <div class="about-panel__body">
          <p>Many migratory birds are able to navigate across thousands of kilometers using the Earth's magnetic field.</p>
          <p>One of the most widely studied hypotheses suggests that this ability is linked to a light-sensitive protein called cryptochrome, found in the retina of birds. When exposed to blue light, cryptochrome may trigger chemical reactions influenced by the orientation of the Earth's magnetic field. Rather than functioning like a conventional compass, this mechanism could generate a visual pattern overlying on vision, allowing birds to perceive direction as part of their visual experience.</p>
          <p>Studies also suggest that birds perform subtle head movements while orienting themselves, potentially using these changes in viewpoint to strengthen their perception of magnetic information.</p>
        </div>
      </section>

      <section class="about-panel__section">
        <h2 class="about-panel__heading">The experience</h2>
        <div class="about-panel__body">
          <p>CRY4 is not a scientific simulation of avian vision, but a speculative interpretation of magnetoreception inspired by current scientific research and the most widely accepted theories surrounding the role of cryptochromes in migratory bird navigation.</p>
          <p>While the exact nature of magnetic perception remains unknown, several studies suggest that magnetic information may be integrated directly into the visual system, producing a perceptual pattern linked to the Earth's magnetic field. Starting from these hypotheses, CRY4 imagines what it might feel like for a human to experience orientation as part of vision itself.</p>
          <p>Rather than representing North through arrows, maps or compass indicators, the experience transforms direction into a perceptual quality. As the user changes orientation, the visual field continuously shifts between coherence and instability, suggesting the presence of an invisible force organizing space.</p>
          <p>The experience is designed to be used on a smartphone. This choice is not only technical but conceptual: calibrating a smartphone compass requires a series of characteristic movements that closely resemble the head-scanning behaviors observed in migratory birds while orienting themselves. By moving the device through space, users unconsciously reproduce gestures that echo those believed to help birds extract magnetic information from their environment.</p>
          <p>Through this interaction, the smartphone becomes a transitional sensory tool that allows the user to momentarily adopt a non-human mode of perception.</p>
        </div>
      </section>

      <section class="about-panel__section">
        <h2 class="about-panel__heading">Technical implementation</h2>
        <div class="about-panel__body">
          <p>CRY4 is a real-time interactive web application developed using JavaScript, Three.js, GLSL shaders and the Webcam API.</p>
          <p>The experience is built around a live camera feed, which is continuously processed through a custom visual pipeline. The webcam image is transformed into a depth-based point cloud representation, generating a dynamic three-dimensional reconstruction of the surrounding environment. Rather than displaying a conventional video stream, the system produces a continuously evolving spatial interpretation of reality.</p>
          <p>Custom GLSL shaders are used to manipulate the point cloud in real time, introducing visual distortions, chromatic transformations and spatial behaviors inspired by the concept of magnetoreception. These effects do not aim to reproduce a scientifically accurate representation of avian vision, but to create a speculative perceptual language capable of suggesting the presence of an invisible orienting force.</p>
          <p>The experience is controlled through the orientation sensors of the device. Compass and gyroscope data are used to estimate the user's heading relative to geographic North, allowing the visual system to react to changes in orientation. As the user moves the smartphone, the visual field continuously reorganizes itself according to the direction they are facing.</p>
          <p>CRY4 explores how creative coding can be used to speculate on forms of perception that lie beyond human senses.</p>
        </div>
      </section>

      <section class="about-panel__section">
        <h2 class="about-panel__heading">Credits</h2>
        <div class="about-panel__body">
          <p>Concept, design and development by Giuseppe Mattia Natale</p>
          <p>IED Turin - Creative Coding 2025/26</p>
        </div>
      </section>
    </div>
  `

  document.body.appendChild(toggle)
  document.body.appendChild(panel)

  const closeButton = panel.querySelector('.about-panel__close')
  let isOpen = false

  function setOpen(nextOpen) {
    if (isOpen === nextOpen) return

    isOpen = nextOpen
    panel.classList.toggle('about-panel--open', isOpen)
    toggle.classList.toggle('about-toggle--active', isOpen)
    toggle.setAttribute('aria-expanded', String(isOpen))
    panel.setAttribute('aria-hidden', String(!isOpen))

    if (isOpen) {
      onOpen?.()
    } else {
      onClose?.()
    }
  }

  toggle.addEventListener('click', () => {
    setOpen(!isOpen)
  })

  closeButton.addEventListener('click', () => {
    setOpen(false)
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) {
      setOpen(false)
    }
  })

  return {
    showControls() {
      toggle.classList.remove('about-toggle--hidden')
    },
    hideControls() {
      setOpen(false)
      toggle.classList.add('about-toggle--hidden')
    }
  }
}
