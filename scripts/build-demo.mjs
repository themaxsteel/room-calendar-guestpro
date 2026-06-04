import { readFileSync, writeFileSync } from 'fs'

const html = readFileSync('demo-guestpro.html', 'utf8')
  .replace("from './src/index.ts'", "from './room-calendar.js'")

writeFileSync('dist/demo-guestpro.html', html)
console.log('demo-guestpro.html → dist/demo-guestpro.html')
