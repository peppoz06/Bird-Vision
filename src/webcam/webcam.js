export async function setupWebcam({ facingMode, mobile = false } = {}) {
  const video = document.createElement('video')

  video.autoplay = true
  video.playsInline = true
  video.muted = true

  const constraints = {
    video: facingMode
      ? {
          facingMode: { ideal: facingMode },
          width: { ideal: mobile ? 1280 : 640 },
          height: { ideal: mobile ? 720 : 480 },
          frameRate: { ideal: 30 }
        }
      : true
  }

  const stream = await navigator.mediaDevices.getUserMedia(constraints)

  video.srcObject = stream

  await video.play()

  return video
}
