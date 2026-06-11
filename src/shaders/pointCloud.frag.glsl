uniform float uTime;

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

  // Base sempre leggibile; alone nord aggiunge luminosita al centro
  float brightness = mix(1.05, 1.45, vNorthFactor);
  color *= brightness;
  color += vNorthFactor * vec3(0.06, 0.14, 0.2);

  vec3 electricGlow = vec3(0.05, 0.22, 0.42);
  color += vCrackle * vElectricStrength * electricGlow * 0.26;
  color += vElectricStrength *
    abs(sin(uTime * 26.0 + vUv.x * 120.0 + vDepth * 36.0)) *
    vec3(0.03, 0.12, 0.24) *
    0.18;

  // Profondita: attenuazione leggera
  color *= mix(0.88, 1.0, pow(vDepth, 0.55));

  color *= mix(0.95, 1.12, smoothstep(0.03, 0.5, vLuma));

  color = pow(color, vec3(0.64));
  color += vec3(0.045, 0.065, 0.085);

  // Direzione errata: leggero tint caldo invece di spegnere l'immagine
  color += vec3(0.06, 0.02, 0.01) * vMisalign * 0.35;

  float edge = distance(vUv, vec2(0.5));
  float vignette = smoothstep(0.99, 0.5, edge);
  color *= vignette;

  // Alpha stabile anche lontano dal nord
  float alpha = grain * mix(0.85, 1.0, vDepth);

  gl_FragColor = vec4(color, alpha);
}
