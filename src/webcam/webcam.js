export async function setupWebcam() {
    const video = document.createElement('video')
  
    video.autoplay = true
    video.playsInline = true
    video.muted = true
  
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true
    })
  
    video.srcObject = stream
  
    await video.play()
  
    return video
  }