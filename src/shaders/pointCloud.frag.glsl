uniform float uTime;

varying vec2 vUv;
varying vec3 vColor;
varying float vDepth;
varying float vNorthFactor;
varying float vElectricStrength;
varying float vCrackle;
varying float vLuma;

void main() {
  vec2 pc = gl_PointCoord - 0.5;
  float dist = length(pc);

  // Grana fine: punto piccolo e netto, senza alone largo
  float grain = 1.0 - smoothstep(0.18, 0.5, dist);
  if (grain <= 0.01) discard;

  vec3 color = tetrachromaticAvianVision(vColor, vUv, uTime);

  float brightness = mix(0.22, 1.25, vNorthFactor);
  color *= brightness;
  color += vNorthFactor * vec3(0.03, 0.08, 0.14);

  vec3 electricGlow = vec3(0.05, 0.22, 0.42);
  color += vCrackle * vElectricStrength * electricGlow * 0.22;
  color += vElectricStrength *
    abs(sin(uTime * 26.0 + vUv.x * 120.0 + vDepth * 36.0)) *
    vec3(0.03, 0.12, 0.24) *
    0.14;

  // Profondita: lontano piu tenue, vicino piu definito
  color *= mix(0.25, 1.0, pow(vDepth, 0.75));

  // Enfatizza bordi e struttura (come nell'immagine di riferimento)
  color *= mix(0.65, 1.15, smoothstep(0.05, 0.45, vLuma));

  color = pow(color, vec3(0.82));

  float edge = distance(vUv, vec2(0.5));
  float vignette = smoothstep(0.95, 0.35, edge);
  color *= vignette;

  // Additive blending: alpha bassa per grana densa
  float alpha = grain * mix(0.18, 0.55, vDepth) * mix(0.4, 1.0, vNorthFactor + 0.1);

  gl_FragColor = vec4(color, alpha);
}
