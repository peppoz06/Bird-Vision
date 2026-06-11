uniform sampler2D uWebcam;
uniform sampler2D uPrevFrame;
uniform float uFlipX;
uniform vec2 uTexelSize;

varying vec2 vUv;

float luminance(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

vec2 sampleUv(vec2 uv) {
  float x = mix(uv.x, 1.0 - uv.x, uFlipX);
  return vec2(x, uv.y);
}

float sampleLum(vec2 uv) {
  return luminance(texture2D(uWebcam, sampleUv(uv)).rgb);
}

// Dark channel prior: regioni scure/velate tendono a essere piu lontane
float darkChannel(vec2 uv) {
  float d = 1.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec3 c = texture2D(uWebcam, sampleUv(uv + vec2(float(i), float(j)) * uTexelSize)).rgb;
      d = min(d, min(c.r, min(c.g, c.b)));
    }
  }
  return d;
}

// Varianza locale della luminanza: texture ricca = oggetti vicini
float localVariance(vec2 uv, vec2 texel, float radius) {
  float sum = 0.0;
  float sumSq = 0.0;
  float count = 0.0;

  for (float j = -2.0; j <= 2.0; j += 1.0) {
    for (float i = -2.0; i <= 2.0; i += 1.0) {
      if (length(vec2(i, j)) > radius) continue;
      float l = sampleLum(uv + vec2(i, j) * texel);
      sum += l;
      sumSq += l * l;
      count += 1.0;
    }
  }

  float mean = sum / count;
  return max(sumSq / count - mean * mean, 0.0);
}

// Gradiente multi-scala (Sobel)
float multiScaleGradient(vec2 uv, vec2 texel) {
  float g = 0.0;

  for (float scale = 1.0; scale <= 3.0; scale += 1.0) {
    vec2 t = texel * scale;
    float tl = sampleLum(uv + vec2(-t.x, -t.y));
    float tc = sampleLum(uv + vec2(0.0, -t.y));
    float tr = sampleLum(uv + vec2(t.x, -t.y));
    float ml = sampleLum(uv + vec2(-t.x, 0.0));
    float mr = sampleLum(uv + vec2(t.x, 0.0));
    float bl = sampleLum(uv + vec2(-t.x, t.y));
    float bc = sampleLum(uv + vec2(0.0, t.y));
    float br = sampleLum(uv + vec2(t.x, t.y));

    float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
    float gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
    g += length(vec2(gx, gy)) / scale;
  }

  return g;
}

// Laplacian of Gaussian: alta risposta = bordi a fuoco = vicino
float focusMeasure(vec2 uv, vec2 texel) {
  float center = sampleLum(uv);
  float blur = 0.0;
  float w = 0.0;

  for (float j = -2.0; j <= 2.0; j += 1.0) {
    for (float i = -2.0; i <= 2.0; i += 1.0) {
      float wgt = exp(-(i * i + j * j) * 0.5);
      blur += sampleLum(uv + vec2(i, j) * texel * 2.0) * wgt;
      w += wgt;
    }
  }

  blur /= w;
  return abs(center - blur);
}

// Proxy motion parallax: differenza temporale suggerisce oggetti in movimento/vicini
float temporalParallax(vec2 uv) {
  vec3 curr = texture2D(uWebcam, sampleUv(uv)).rgb;
  vec3 prev = texture2D(uPrevFrame, sampleUv(uv)).rgb;
  return length(curr - prev);
}

void main() {
  vec2 uv = vUv;
  vec2 texel = uTexelSize;

  float lum = sampleLum(uv);
  float grad = multiScaleGradient(uv, texel);
  float variance = localVariance(uv, texel, 2.5);
  float dark = darkChannel(uv);
  float focus = focusMeasure(uv, texel);
  float motion = temporalParallax(uv);

  // Combinazione pesata (approccio ibrido tra depth map e segnali ML-like)
  float nearFromLum = pow(lum, 0.72);
  float nearFromGrad = smoothstep(0.02, 0.35, grad);
  float nearFromVar = smoothstep(0.001, 0.025, variance);
  float farFromDark = smoothstep(0.05, 0.55, 1.0 - dark);
  float nearFromFocus = smoothstep(0.005, 0.08, focus);
  float nearFromMotion = smoothstep(0.01, 0.12, motion);

  float depth =
    nearFromLum * 0.22 +
    nearFromGrad * 0.24 +
    nearFromVar * 0.18 +
    farFromDark * 0.14 +
    nearFromFocus * 0.14 +
    nearFromMotion * 0.08;

  // Centro leggermente piu vicino (effetto camera)
  depth += (1.0 - length(uv - 0.5) * 1.4) * 0.06;

  depth = clamp(depth, 0.0, 1.0);

  gl_FragColor = vec4(depth, depth, depth, 1.0);
}
