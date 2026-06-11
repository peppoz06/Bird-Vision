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
varying float vMisalign;

vec2 sampleTexUv(vec2 uv) {
  float x = mix(uv.x, 1.0 - uv.x, uFlipX);
  return vec2(x, uv.y);
}

void main() {
  vUv = pointUv;

  vec2 jitter = vec2(
    hash(pointUv * 97.3),
    hash(pointUv * 53.7 + 1.9)
  ) - 0.5;
  vec2 jitterUv = jitter / uGridSize * 0.85;

  vec2 mouse = uMouse / uResolution;
  vec2 sampleUv = pointUv + jitterUv;
  vec2 toNorth = mouse - sampleUv;
  float d = length(toNorth);

  // Alone nord sullo schermo (indipendente dall'allineamento bussola)
  vNorthFactor = pow(smoothstep(0.68, 0.0, d), 0.8);

  // Quanto siamo lontani dal nord reale (0=allineati, 1=direzione opposta)
  vMisalign = clamp(1.0 - uNorthStrength, 0.0, 1.0);
  float calmFactor = 1.0 - vMisalign * 0.8;

  // Lontano dal nord: meno distorsione illeggibile, piu agitazione
  float flowStrength = pow(smoothstep(0.04, 0.58, d), 1.35) * calmFactor;
  vec2 distortedUv = sampleUv + flowField(sampleUv, toNorth, d, uTime) * flowStrength * 1.45;

  float crackle;
  vElectricStrength = pow(smoothstep(0.08, 0.65, d), 1.4) * calmFactor;
  distortedUv += electricFieldNoise(sampleUv, toNorth, d, uTime, crackle) * vElectricStrength * 1.4;
  vCrackle = crackle;

  // Agitazione punti: manifesta direzione errata
  float agitateAmount = vMisalign * (0.65 + 0.35 * smoothstep(0.1, 0.7, d));
  vec2 agitate = vec2(
    sin(uTime * 16.0 + pointUv.x * 55.0 + hash(pointUv * 12.0) * 6.28),
    cos(uTime * 19.0 + pointUv.y * 49.0 + hash(pointUv * 7.0 + 2.1) * 6.28)
  );
  agitate += vec2(
    sin(uTime * 27.0 + hash(pointUv * 3.7) * 10.0),
    cos(uTime * 31.0 + hash(pointUv * 5.1) * 10.0)
  ) * 0.4;

  vec2 agitateOffset = agitate * agitateAmount * 0.016;
  distortedUv += agitateOffset * 5.0;

  vec2 texUv = sampleTexUv(distortedUv);
  vColor = texture2D(uWebcam, texUv).rgb;
  vDepth = texture2D(uDepth, clamp(sampleUv, 0.001, 0.999)).r;
  vLuma = dot(vColor, vec3(0.2126, 0.7152, 0.0722));

  vec3 pos = position;

  float z = (1.0 - vDepth) * uDepthScale;
  pos.z -= z;

  vec2 radial = (pointUv - 0.5) * 2.0;
  float farFromNorth = pow(smoothstep(0.06, 0.62, d), 1.25) * calmFactor;
  pos.xy += radial * z * (0.06 + farFromNorth * 0.09);
  pos.xy += radial * farFromNorth * length(radial) * 0.055;
  pos.xy += jitter / uGridSize * 0.04;

  // Shake spaziale quando la bussola e fuori dal nord
  pos.xy += agitateOffset;
  pos.z += sin(uTime * 22.0 + pointUv.x * 80.0 + pointUv.y * 60.0) * agitateAmount * 0.03;

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
