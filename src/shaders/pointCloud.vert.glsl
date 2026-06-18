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
uniform float uMobileBoost;
uniform float uExposureLift;

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

  // Direzione del nord sullo schermo: verso dove l'utente deve ruotare.
  vec2 northScreenDir = mouse - vec2(0.5, 0.5);
  float northDirLen = length(northScreenDir);
  northScreenDir = northDirLen > 0.001 ? northScreenDir / northDirLen : vec2(0.0);
  vec2 northTangent = vec2(-northScreenDir.y, northScreenDir.x);

  // Agitazione proporzionale a quanto si e distanti dal nord (vMisalign).
  float agitateAmount = vMisalign * (0.6 + 0.4 * smoothstep(0.05, 0.7, d));

  // Scatto ritmico verso il nord: ogni punto "dardeggia" nella direzione giusta,
  // suggerendo all'utente da che parte muoversi.
  float flickPhase = uTime * 9.0
    + hash(pointUv * 12.0) * 6.2831
    + dot(pointUv, northScreenDir) * 8.0;
  float flick = pow(0.5 + 0.5 * sin(flickPhase), 3.0);

  // Vibrazione trasversale lieve per dare energia senza confondere la direzione.
  float shimmer = sin(uTime * 24.0 + hash(pointUv * 5.1) * 6.2831);

  vec2 directional = northScreenDir * flick + northTangent * shimmer * 0.22;

  // Residuo caotico minimo.
  vec2 chaos = vec2(
    sin(uTime * 26.0 + hash(pointUv * 3.7) * 10.0),
    cos(uTime * 30.0 + hash(pointUv * 5.1) * 10.0)
  ) * 0.12;

  vec2 agitate = directional + chaos;
  vec2 agitateOffset = agitate * agitateAmount * 0.03;

  // Lo spostamento UV resta lieve per non strappare il colore.
  distortedUv += agitateOffset * mix(1.0, 0.3, agitateAmount);

  vec2 texUv = sampleTexUv(distortedUv);
  vec3 rawColor = texture2D(uWebcam, texUv).rgb;
  rawColor = pow(rawColor, vec3(0.82)) * uMobileBoost + uExposureLift;
  vColor = rawColor;
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

  // Shake spaziale direzionale quando la bussola e fuori dal nord
  pos.xy += agitateOffset;
  pos.z += sin(uTime * 20.0 + pointUv.x * 80.0 + pointUv.y * 60.0) * agitateAmount * 0.025;

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
