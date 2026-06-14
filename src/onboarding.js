export let onboardingStep = 0

const SCREENS = [
  `You're about to
experience an avian
navigation system`,
  `Migratory birds use the
Earth's Magnetic field
to orient themselves`,
  `Move your phone
Find North`
]

const STEP_DURATIONS = [4000, 5000, 4000]
const TEXT_FADE_MS = 600
const OVERLAY_FADE_MS = 1000

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

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

export function runOnboarding({ overlay, stage, onComplete }) {
  const textEl = overlay.querySelector('.onboarding__text')

  async function fadeIn(step) {
    onboardingStep = step
    textEl.textContent = SCREENS[step]
    textEl.style.opacity = '0'
    void textEl.offsetWidth
    textEl.style.opacity = '1'
    await waitForTransition(textEl, TEXT_FADE_MS)
  }

  async function fadeOut() {
    textEl.style.opacity = '0'
    await waitForTransition(textEl, TEXT_FADE_MS)
  }

  async function showScreen(step) {
    await fadeIn(step)
    await delay(STEP_DURATIONS[step])
    await fadeOut()
  }

  function finishOnboarding() {
    onboardingStep = 'completed'
    overlay.classList.add('onboarding--fade-out')
    stage.classList.remove('experience-stage--blurred')

    window.setTimeout(() => {
      overlay.remove()
      onComplete()
    }, OVERLAY_FADE_MS)
  }

  async function runSequence() {
    for (let step = 0; step < SCREENS.length; step++) {
      await showScreen(step)
    }

    finishOnboarding()
  }

  runSequence()
}
