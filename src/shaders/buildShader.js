import commonGlsl from './common.glsl?raw'

export function buildShader(source) {
  return `${commonGlsl}\n${source}`
}
