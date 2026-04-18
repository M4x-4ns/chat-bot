const fs = require('fs')
const path = require('path')

const metadataPath = path.join(__dirname, '../../metadata.json')
const outputPath = path.join(__dirname, '../src/data/movies.js')

const chunks = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))

// Deduplicate by title, keep one entry per movie
const seen = new Set()
const movies = []

for (const chunk of chunks) {
  const title = chunk.filename
  if (!seen.has(title)) {
    seen.add(title)
    movies.push({
      title: chunk.filename,
      imdbId: chunk.metadata?.imdb_id || null,
      year: parseInt(chunk.metadata?.release_year) || null,
      rating: parseFloat(chunk.metadata?.imdb_rating) || null,
    })
  }
}

// Sort by rating desc, keep top 80
const sorted = movies
  .filter(m => m.imdbId && m.year)
  .sort((a, b) => (b.rating || 0) - (a.rating || 0))
  .slice(0, 80)

const output = `// Auto-generated from metadata.json — do not edit manually
export const MOVIES = ${JSON.stringify(sorted, null, 2)}

export const YEAR_RANGES = [
  { label: '\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14', min: 0, max: 9999 },
  { label: '2020s', min: 2020, max: 9999 },
  { label: '2010s', min: 2010, max: 2019 },
  { label: '2000s', min: 2000, max: 2009 },
  { label: '\u0E01\u0E48\u0E2D\u0E19 2000', min: 0, max: 1999 },
]

export function filterByYear(movies, range) {
  if (range.min === 0 && range.max === 9999) return movies
  return movies.filter(m => m.year >= range.min && m.year <= range.max)
}
`

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, output)
console.log(`Extracted ${sorted.length} movies to src/data/movies.js`)
