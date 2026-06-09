import { defineConfig } from 'vite'

export default defineConfig({
  // Path relativi: gli asset funzionano sotto user.github.io/<repo>/
  base: './',
  assetsInclude: ['**/*.glsl'],
  build: {
    // GitHub Pages "Deploy from a branch -> main -> /docs"
    outDir: 'docs',
    emptyOutDir: true
  },
  server: {
    host: true,
    open: true
  }
})
