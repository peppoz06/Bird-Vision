uniform sampler2D uWebcam;
uniform sampler2D uDepth;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform vec2 uGridSize;
uniform float uTime;
uniform float uFlipX;
uniform float uNorthStrength;
uniform float uPointScale;
uniform float uDepthScale;

attribute vec2 pointUv;

varying vec2 vUv;
varying vec3 vColor;
varying float vDepth;
varying float vNorthFactor;
varying float vElectricStrength;
varying float vCrackle;
varying float vLuma;

vec2 sampleTexUv(vec2 uv) {
  float x = mix(uv.x, 1.0 - uv.x, uFlipX);
  return vec2(x, uv.y);
}

void main() {
  vUv = pointUv;

  // Jitter sub-pixel per distribuzione organica (grana fine)
  vec2 jitter = vec2(
    hash(pointUv * 97.3),
    hash(pointUv * 53.7 + 1.9)
  ) - 0.5;
  vec2 jitterUv = jitter / uGridSize * 0.85;

  vec2 mouse = uMouse / uResolution;
  vec2 sampleUv = pointUv + jitterUv;
  vec2 toNorth = mouse - sampleUv;
  float d = length(toNorth);

  float northBrightness = pow(smoothstep(0.68, 0.0, d), 0.8) * uNorthStrength;
  vNorthFactor = northBrightness;

  float flowStrength = pow(smoothstep(0.05, 0.62, d), 1.45);
  vec2 distortedUv = sampleUv + flowField(sampleUv, toNorth, d, uTime) * flowStrength;

  float crackle;
  vElectricStrength = pow(smoothstep(0.1, 0.7, d), 1.55);
  distortedUv += electricFieldNoise(sampleUv, toNorth, d, uTime, crackle) * vElectricStrength;
  vCrackle = crackle;

  vec2 texUv = sampleTexUv(distortedUv);
  vColor = texture2D(uWebcam, texUv).rgb;
  vDepth = texture2D(uDepth, clamp(sampleUv, 0.001, 0.999)).r;
  vLuma = dot(vColor, vec3(0.2126, 0.7152, 0.0722));

  vec3 pos = position;

  // Profondita: separazione netta tra piani
  float z = (1.0 - vDepth) * uDepthScale;
  pos.z -= z;

  // Parallax leggero: mantiene la forma senza sfocare
  vec2 radial = (pointUv - 0.5) * 2.0;
  pos.xy += radial * z * 0.06;
  pos.xy += jitter / uGridSize * 0.04;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float perspectiveScale = 160.0 / max(-mvPosition.z, 0.12);
  float depthSize = mix(0.55, 0.95, vDepth);
  float lumaSize = mix(0.75, 1.0, smoothstep(0.04, 0.5, vLuma));

  gl_PointSize = clamp(
    uPointScale * depthSize * lumaSize * perspectiveScale,
    1.5,
    3.0
  );
}
