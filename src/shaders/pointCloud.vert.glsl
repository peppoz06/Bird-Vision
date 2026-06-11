uniform sampler2D uWebcam;
uniform sampler2D uDepth;
uniform vec2 uMouse;
uniform vec2 uResolution;
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

vec2 sampleTexUv(vec2 uv) {
  float x = mix(uv.x, 1.0 - uv.x, uFlipX);
  return vec2(x, uv.y);
}

void main() {
  vUv = pointUv;

  vec2 mouse = uMouse / uResolution;
  vec2 toNorth = mouse - pointUv;
  float d = length(toNorth);

  float northBrightness = pow(smoothstep(0.68, 0.0, d), 0.8) * uNorthStrength;
  vNorthFactor = northBrightness;

  float flowStrength = pow(smoothstep(0.05, 0.62, d), 1.45);
  vec2 distortedUv = pointUv + flowField(pointUv, toNorth, d, uTime) * flowStrength;

  float crackle;
  vElectricStrength = pow(smoothstep(0.1, 0.7, d), 1.55);
  distortedUv += electricFieldNoise(pointUv, toNorth, d, uTime, crackle) * vElectricStrength;
  vCrackle = crackle;

  vec2 texUv = sampleTexUv(distortedUv);
  vColor = texture2D(uWebcam, texUv).rgb;
  vDepth = texture2D(uDepth, pointUv).r;

  vec3 pos = position;

  // Profondita: oggetti vicini avanzano, lontani si ritirano
  float z = (1.0 - vDepth) * uDepthScale;
  pos.z -= z;

  // Espansione radiale per volume percepito
  vec2 radial = (pointUv - 0.5) * 2.0;
  pos.xy += radial * vDepth * 0.18;

  // Leggera curvatura parallax orizzontale
  pos.x += radial.x * z * 0.12;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float perspectiveScale = 320.0 / max(-mvPosition.z, 0.1);
  gl_PointSize = uPointScale * mix(1.0, 3.8, vDepth) * perspectiveScale;
}
