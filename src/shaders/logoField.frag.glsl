uniform sampler2D uFieldMap;
uniform float uTime;
uniform float uPulseSpeed;
uniform vec2 uFieldCenter;
uniform vec2 uAspect;

varying vec2 vUv;

void main() {
  vec4 tex = texture2D(uFieldMap, vUv);
  float line = 1.0 - dot(tex.rgb, vec3(0.299, 0.587, 0.114));
  line = smoothstep(0.08, 0.42, line);

  if (line < 0.001) {
    discard;
  }

  vec2 fromCenter = (vUv - uFieldCenter) * vec2(uAspect.x, 1.0);
  float dist = length(fromCenter);
  float maxDist = 0.72;
  float normDist = clamp(dist / maxDist, 0.0, 1.0);

  float cycle = fract(uTime * uPulseSpeed);
  float band = 0.11;
  float pulse = smoothstep(cycle - band, cycle, normDist)
    * (1.0 - smoothstep(cycle, cycle + band, normDist));

  float angle = atan(fromCenter.y, fromCenter.x);
  float iridescence = sin(angle * 2.5 + uTime * 1.6) * 0.5 + 0.5;
  vec3 glow = mix(vec3(0.78, 0.9, 1.0), vec3(0.55, 0.78, 1.0), iridescence);

  float base = 0.34 + pulse * 0.66;
  vec3 color = vec3(line * base) + glow * line * pulse * 0.85;
  float alpha = line * (0.38 + pulse * 0.62);

  gl_FragColor = vec4(color, alpha);
}
