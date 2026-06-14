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

const STEP_DURATION = 3000
const FADE_DURATION = 1000

export function runOnboarding({ overlay, stage, onComplete }) {
  const textEl = overlay.querySelector('.onboarding__text')

  function showStep(step) {
    onboardingStep = step
    textEl.style.opacity = '0'

    requestAnimationFrame(() => {
      textEl.textContent = SCREENS[step]
      textEl.style.opacity = '1'
    })
  }

  function finishOnboarding() {
    onboardingStep = 'completed'
    overlay.classList.add('onboarding--fade-out')
    stage.classList.remove('experience-stage--blurred')

    window.setTimeout(() => {
      overlay.remove()
      onComplete()
    }, FADE_DURATION)
  }

  showStep(0)

  window.setTimeout(() => showStep(1), STEP_DURATION)
  window.setTimeout(() => showStep(2), STEP_DURATION * 2)
  window.setTimeout(finishOnboarding, STEP_DURATION * 3)
}
