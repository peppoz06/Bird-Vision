uniform sampler2D uMask;
uniform vec2 uResolution;
uniform vec2 uFit;
uniform float uTime;

varying vec2 vUv;

void main() {
  // "contain" mapping: keep the drawing aspect ratio inside the canvas box.
  vec2 uv = (vUv - 0.5) / uFit + 0.5;

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float mask = texture2D(uMask, uv).a;

  if (mask < 0.02) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // Pixel-space offset from the center of the drawing (aspect aware).
  vec2 p = (vUv - 0.5) * uResolution;
  float dist = length(p);

  // Vertical half-extent of the visible drawing: the wave must reach the
  // top and bottom tips, which are the farthest points from the center.
  float maxDist = uFit.y * 0.5 * uResolution.y * 1.04;
  float nd = clamp(dist / maxDist, 0.0, 1.25);

  // Wavefront travelling outward from the center (nd = 0) to the tips (nd = 1).
  float speed = 0.32;
  float front = fract(uTime * speed) * 1.12;

  // Bright travelling band centered on the wavefront.
  float band = smoothstep(0.16, 0.0, abs(nd - front));

  // Soft luminous tail trailing behind the front.
  float tail = smoothstep(0.55, 0.0, front - nd) * step(nd, front) * 0.4;

  float pulse = band + tail;

  // Gentle constant visibility so the field is always perceptible.
  float base = 0.24;
  float intensity = base + pulse * 1.2;

  // Subtle iridescence driven by angle and the moving wavefront.
  float ang = atan(p.y, p.x);
  vec3 cool = vec3(0.62, 0.82, 1.0);
  vec3 warm = vec3(0.86, 0.80, 1.0);
  vec3 tint = mix(cool, warm, 0.5 + 0.5 * sin(ang * 2.0 + front * 6.2831));

  vec3 col = tint * intensity;
  float alpha = mask * clamp(intensity, 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}
