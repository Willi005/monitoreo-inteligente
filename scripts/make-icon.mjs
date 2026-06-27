// Genera build/icon.png (1024) y build/icon.ico (multi-resolución) a partir de
// build/icon.svg. Lo usa electron-builder como icono de la app/instalador.
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = path.join(root, 'build', 'icon.svg')
const pngPath = path.join(root, 'build', 'icon.png')
const icoPath = path.join(root, 'build', 'icon.ico')

const svg = await readFile(svgPath)

// PNG grande para electron-builder (y usos generales).
await sharp(svg, { density: 384 }).resize(1024, 1024).png().toBuffer().then((b) => writeFile(pngPath, b))

// ICO con los tamaños estándar de Windows.
const sizes = [256, 128, 64, 48, 32, 16]
const buffers = await Promise.all(
  sizes.map((s) => sharp(svg, { density: 384 }).resize(s, s).png().toBuffer())
)
const ico = await pngToIco(buffers)
await writeFile(icoPath, ico)

console.log('Icono generado: build/icon.png (1024) y build/icon.ico [' + sizes.join(', ') + ']')
