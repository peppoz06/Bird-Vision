export async function setupWebcam({ facingMode } = {}) {
  const video = document.createElement('video')

  video.autoplay = true
  video.playsInline = true
  video.muted = true

  const constraints = {
    video: facingMode ? { facingMode: { ideal: facingMode } } : true
  }

  const stream = await navigator.mediaDevices.getUserMedia(constraints)

  video.srcObject = stream

  await video.play()

  return video
}
