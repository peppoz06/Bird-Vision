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

export function runOnboarding({ overlay, stage, onComplete }) {
  const textEl = overlay.querySelector('.onboarding__text')

  function fadeIn(step) {
    onboardingStep = step
    textEl.textContent = SCREENS[step]
    textEl.style.opacity = '0'

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        textEl.style.opacity = '1'
      })
    })
  }

  function fadeOut() {
    textEl.style.opacity = '0'
    return delay(TEXT_FADE_MS)
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
    fadeIn(0)
    await delay(STEP_DURATIONS[0])

    for (let step = 1; step < SCREENS.length; step++) {
      await fadeOut()
      fadeIn(step)
      await delay(STEP_DURATIONS[step])
    }

    await fadeOut()
    finishOnboarding()
  }

  runSequence()
}
