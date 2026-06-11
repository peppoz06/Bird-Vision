uniform float uTime;

varying vec2 vUv;
varying vec3 vColor;
varying float vDepth;
varying float vNorthFactor;
varying float vElectricStrength;
varying float vCrackle;

void main() {
  vec2 pc = gl_PointCoord - 0.5;
  float dist = length(pc);

  // Splat morbido con alone interno
  float core = 1.0 - smoothstep(0.0, 0.42, dist);
  float halo = 1.0 - smoothstep(0.25, 0.5, dist);
  float mask = max(core, halo * 0.35);

  if (mask <= 0.001) discard;

  vec3 color = tetrachromaticAvianVision(vColor, vUv, uTime);

  // Alone nord + attenuazione profondita
  float brightness = mix(0.28, 1.35, vNorthFactor);
  color *= brightness;
  color += vNorthFactor * vec3(0.04, 0.1, 0.16);

  // Glow elettrico
  vec3 electricGlow = vec3(0.05, 0.22, 0.42);
  color += vCrackle * vElectricStrength * electricGlow * 0.28;
  color += vElectricStrength *
    abs(sin(uTime * 26.0 + vUv.x * 120.0 + vDepth * 36.0)) *
    vec3(0.03, 0.12, 0.24) *
    0.18;

  // Oggetti lontani: piu scuri e trasparenti
  color *= mix(0.32, 1.0, pow(vDepth, 0.85));

  // Occlusione ambientale tra punti (simula interstizi della nuvola)
  float ao = mix(0.55, 1.0, vDepth);
  color *= ao;

  color = pow(color, vec3(0.74));

  // Vignette percepita
  float edge = distance(vUv, vec2(0.5));
  float vignette = smoothstep(0.92, 0.28, edge);
  color *= vignette;

  float alpha = mask * mix(0.5, 1.0, vDepth) * mix(0.35, 1.0, vNorthFactor + 0.15);

  gl_FragColor = vec4(color, alpha);
}
