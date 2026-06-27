// Genera build/icon.png (512) y build/icon.ico (multi-resolución) a partir de
// build/icon-source.png (icono DeskSense, variante clara/blanca de 512×512).
// Lo usa electron-builder como icono de la app/instalador para el escritorio.
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcPath = path.join(root, 'build', 'icon-source.png')
const pngPath = path.join(root, 'build', 'icon.png')
const icoPath = path.join(root, 'build', 'icon.ico')

// PNG para electron-builder (y usos generales).
await sharp(srcPath).resize(512, 512).png().toBuffer().then((b) => writeFile(pngPath, b))

// ICO con los tamaños estándar de Windows.
const sizes = [256, 128, 64, 48, 32, 16]
const buffers = await Promise.all(sizes.map((s) => sharp(srcPath).resize(s, s).png().toBuffer()))
const ico = await pngToIco(buffers)
await writeFile(icoPath, ico)

console.log('Icono generado: build/icon.png (512) y build/icon.ico [' + sizes.join(', ') + ']')
