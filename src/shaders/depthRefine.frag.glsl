uniform sampler2D uDepthRaw;
uniform sampler2D uDepthPrev;
uniform sampler2D uWebcam;
uniform float uFlipX;
uniform vec2 uTexelSize;

varying vec2 vUv;

vec2 sampleUv(vec2 uv) {
  float x = mix(uv.x, 1.0 - uv.x, uFlipX);
  return vec2(x, uv.y);
}

vec3 sampleColor(vec2 uv) {
  return texture2D(uWebcam, sampleUv(uv)).rgb;
}

float sampleDepthRaw(vec2 uv) {
  return texture2D(uDepthRaw, uv).r;
}

// Joint bilateral filter: smoothing edge-aware guidato dal colore
float refineDepth(vec2 uv) {
  vec3 centerColor = sampleColor(uv);
  float centerDepth = sampleDepthRaw(uv);
  float sum = 0.0;
  float wSum = 0.0;

  for (float j = -3.0; j <= 3.0; j += 1.0) {
    for (float i = -3.0; i <= 3.0; i += 1.0) {
      vec2 offset = vec2(i, j) * uTexelSize;
      vec2 samplePos = uv + offset;

      vec3 sampleCol = sampleColor(samplePos);
      float sampleDep = sampleDepthRaw(samplePos);

      float spatialW = exp(-dot(offset / uTexelSize, offset / uTexelSize) * 0.35);
      float rangeW = exp(-dot(sampleCol - centerColor, sampleCol - centerColor) * 18.0);
      float w = spatialW * rangeW;

      sum += sampleDep * w;
      wSum += w;
    }
  }

  return sum / max(wSum, 0.0001);
}

void main() {
  vec2 uv = vUv;

  float refined = refineDepth(uv);
  float prev = texture2D(uDepthPrev, uv).r;

  // Stabilizzazione temporale: riduce flicker mantenendo i bordi
  float motion = length(
    sampleColor(uv) -
    texture2D(uWebcam, sampleUv(uv + uTexelSize)).rgb
  );
  float temporalBlend = mix(0.82, 0.55, smoothstep(0.0, 0.15, motion));
  float depth = mix(refined, prev, temporalBlend);

  depth = clamp(depth, 0.0, 1.0);

  gl_FragColor = vec4(depth, depth, depth, 1.0);
}
