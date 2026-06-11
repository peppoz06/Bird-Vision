uniform float uTime;
uniform float uExposureLift;

varying vec2 vUv;
varying vec3 vColor;
varying float vDepth;
varying float vNorthFactor;
varying float vElectricStrength;
varying float vCrackle;
varying float vLuma;
varying float vMisalign;

void main() {
  vec2 pc = gl_PointCoord - 0.5;
  float dist = length(pc);

  float grain = 1.0 - smoothstep(0.32, 0.5, dist);
  if (grain <= 0.01) discard;

  vec3 color = tetrachromaticAvianVision(vColor, vUv, uTime);

  // Leggibilita base indipendente dall'alone; piu chiaro quando fuori nord
  float readability = mix(1.18, 1.0, vMisalign * 0.65);
  float haloBoost = mix(1.0, 1.35, vNorthFactor);
  color *= readability * haloBoost;
  color += vNorthFactor * vec3(0.06, 0.14, 0.2);

  vec3 electricGlow = vec3(0.05, 0.22, 0.42);
  color += vCrackle * vElectricStrength * electricGlow * 0.24;
  color += vElectricStrength *
    abs(sin(uTime * 26.0 + vUv.x * 120.0 + vDepth * 36.0)) *
    vec3(0.03, 0.12, 0.24) *
    0.16;

  color *= mix(0.9, 1.0, pow(vDepth, 0.5));
  color *= mix(0.96, 1.1, smoothstep(0.03, 0.5, vLuma));

  color = pow(color, vec3(0.58));
  color += vec3(0.055, 0.075, 0.095) + uExposureLift;

  color += vec3(0.05, 0.02, 0.01) * vMisalign * 0.25;

  float edge = distance(vUv, vec2(0.5));
  float vignette = smoothstep(0.99, 0.52, edge);
  color *= vignette;

  float alpha = grain * mix(0.9, 1.0, vDepth);

  gl_FragColor = vec4(color, alpha);
}
