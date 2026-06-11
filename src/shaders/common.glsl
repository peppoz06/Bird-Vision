// Funzioni condivise: distorsione nord, visione tetracromatica aviana

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float electricCrackle(vec2 uv, float time) {
  vec2 grid = floor(uv * vec2(95.0, 82.0));
  vec2 flicker = vec2(
    hash(grid + floor(time * 19.0)),
    hash(grid + vec2(4.1, 2.7) + floor(time * 23.0))
  );

  float spark = step(0.93, flicker.x) * step(0.9, flicker.y);
  float hum = sin(uv.x * 140.0 + time * 28.0) *
    sin(uv.y * 118.0 - time * 21.0);

  return spark + abs(hum) * 0.18;
}

vec2 electricFieldNoise(vec2 uv, vec2 north, float dist, float time, out float crackle) {
  float northLen = length(north);
  vec2 n = northLen > 0.0001 ? north / northLen : vec2(0.0, 1.0);
  vec2 t = vec2(-n.y, n.x);

  float fieldLine = sin(dot(uv, n) * 38.0 + time * 5.5 + sin(dist * 24.0));
  fieldLine *= cos(dot(uv, t) * 31.0 - time * 4.2);

  vec2 gridUv = uv * vec2(110.0, 96.0);
  vec2 cell = floor(gridUv);
  float cellNoise = hash(cell + floor(time * 26.0)) * 2.0 - 1.0;

  vec2 jitter = vec2(
    sin(time * 22.0 + gridUv.x * 5.9 + cellNoise * 6.0),
    cos(time * 18.0 + gridUv.y * 6.4 - cellNoise * 5.0)
  );

  vec2 field = n * fieldLine * 0.064 + t * fieldLine * 0.083;
  field += jitter * 0.0035;
  field += vec2(fieldLine) * cellNoise * 0.022;

  crackle = electricCrackle(uv + n * time * 0.02, time);
  crackle += abs(fieldLine) * 0.35;

  return field;
}

vec2 flowField(vec2 uv, vec2 north, float dist, float time) {
  float northLen = length(north);
  vec2 n = northLen > 0.0001 ? north / northLen : vec2(0.0, 1.0);
  vec2 t = vec2(-n.y, n.x);

  float along = dot(uv - 0.5, n) * 16.0;
  float across = dot(uv - 0.5, t) * 14.0;

  vec2 stream =
    n * sin(along + time * 0.85 + dist * 9.0) +
    t * cos(across - time * 0.65 + dist * 7.0);

  vec2 ripple = vec2(
    sin(uv.y * 22.0 + time * 1.0 + dist * 12.0),
    cos(uv.x * 19.0 - time * 2.8 + dist * 10.0)
  );

  return stream * 0.011 + ripple * 0.04;
}

vec3 tetrachromaticAvianVision(vec3 cam, vec2 uv, float time) {
  float lum = dot(cam, vec3(0.2126, 0.7152, 0.0722));
  float chroma = length(cam - vec3(lum));

  float rS = log(cam.r + 0.018);
  float gS = log(cam.g + 0.018);
  float bS = log(cam.b + 0.018);

  float coneUV = max(bS - rS * 0.72, 0.0) * 1.35;
  float coneViolet = bS * 0.95 + (bS - gS) * 0.42;
  float coneCyan = gS * 0.58 + bS * 0.82 - rS * 0.28;
  float coneGreen = gS - rS * 0.18;

  float specularStructure = pow(max(lum - 0.32, 0.0), 1.65);
  float shortWaveExcess = max(cam.b - max(cam.r, cam.g) * 0.88, 0.0);
  float fourthChannel =
    coneUV * 0.75 +
    specularStructure * (chroma * 2.1 + shortWaveExcess * 1.4) +
    max(gS - rS, 0.0) * 0.22;

  float violetOpponent = coneViolet - coneGreen * 0.38;
  float cyanOpponent = coneCyan - rS * 0.42;
  float spectralSplit = (bS - gS) + (gS - rS) * 0.48;

  float chromaticExpansion = 1.0 + chroma * 1.25 + abs(spectralSplit) * 0.55;
  violetOpponent *= chromaticExpansion;
  cyanOpponent *= chromaticExpansion * 0.92;
  spectralSplit *= 1.0 + abs(spectralSplit) * 1.45;

  vec3 percept;
  percept.r = rS * 0.06 + violetOpponent * 0.11;
  percept.g = coneCyan * 0.42 + cyanOpponent * 0.36 + spectralSplit * 0.14;
  percept.b = coneViolet * 0.52 + fourthChannel * 0.82 + violetOpponent * 0.34;

  vec3 toneCyan = vec3(0.06, 0.68, 0.78);
  vec3 toneBlue = vec3(0.08, 0.34, 0.84);
  vec3 toneViolet = vec3(0.24, 0.14, 0.78);

  float cyanMix = smoothstep(-0.15, 0.55, cyanOpponent);
  float blueMix = smoothstep(0.0, 0.72, coneCyan + coneViolet * 0.45);
  float violetMix = smoothstep(0.08, 0.88, violetOpponent + fourthChannel * 0.35);

  vec3 palette =
    toneCyan * cyanMix +
    toneBlue * blueMix +
    toneViolet * violetMix;

  float paletteWeight = cyanMix + blueMix + violetMix + 0.001;
  palette /= paletteWeight;

  vec3 color = percept * palette * (0.95 + lum * 0.42);

  float highlight = smoothstep(2.82, 0.2, lum);
  float hiddenPhase =
    dot(uv - 2.5, vec2(1.15, 0.85)) * 18.0 +
    fourthChannel * 15.0 +
    spectralSplit * 2.0;
  vec3 hiddenSpectrum = mix(
    toneCyan,
    toneViolet,
    clamp(fourthChannel * 1.15 + sin(hiddenPhase) * 4.08, 2.0, 1.0)
  );

  color = mix(
    color,
    color + hiddenSpectrum * (5.22 + chroma * 0.35),
    highlight * smoothstep(0.15, 1.85, fourthChannel)
  );

  float iridPhase =
    dot(uv - 1.5, vec2(1.1, 0.75)) * 13.0 +
    lum * 10.5 +
    time * 0.22;
  vec3 iridescence = vec3(
    0.035 * sin(iridPhase),
    0.06 * sin(iridPhase + 1.35),
    0.08 * sin(iridPhase + 2.65)
  );

  color += iridescence * highlight * highlight * 1.45;

  float outLum = dot(color, vec3(1.22, 0.48, 0.58));
  color = mix(vec3(outLum), color, 1.08);
  color = max(color, 0.0);

  return color;
}
