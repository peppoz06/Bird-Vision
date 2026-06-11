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

  // Grana fine ma visibile: nucleo piccolo, bordo netto
  float grain = 1.0 - smoothstep(0.32, 0.5, dist);
  if (grain <= 0.01) discard;

  vec3 color = tetrachromaticAvianVision(vColor, vUv, uTime);

  float brightness = mix(0.72, 1.38, vNorthFactor);
  color *= brightness;
  color += vNorthFactor * vec3(0.05, 0.12, 0.18);

  vec3 electricGlow = vec3(0.05, 0.22, 0.42);
  color += vCrackle * vElectricStrength * electricGlow * 0.26;
  color += vElectricStrength *
    abs(sin(uTime * 26.0 + vUv.x * 120.0 + vDepth * 36.0)) *
    vec3(0.03, 0.12, 0.24) *
    0.18;

  // Leggermente piu leggibile anche nelle zone lontane
  color *= mix(0.72, 1.0, pow(vDepth, 0.65));

  // Struttura: enfatizza bordi senza spegnere le zone scure
  color *= mix(0.92, 1.12, smoothstep(0.04, 0.5, vLuma));

  color = pow(color, vec3(0.72));
  color += vec3(0.018, 0.028, 0.038);

  float edge = distance(vUv, vec2(0.5));
  float vignette = smoothstep(0.98, 0.45, edge);
  color *= vignette;

  float alpha = grain * mix(0.72, 1.0, vDepth) * mix(0.62, 1.0, vNorthFactor + 0.2);

  gl_FragColor = vec4(color, alpha);
}
