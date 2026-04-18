import { filterByYear, MOVIES, YEAR_RANGES } from './movies'

const sample = [
  { title: 'A', imdbId: 'tt1', year: 2022, rating: 7 },
  { title: 'B', imdbId: 'tt2', year: 2015, rating: 8 },
  { title: 'C', imdbId: 'tt3', year: 2005, rating: 6 },
  { title: 'D', imdbId: 'tt4', year: 1998, rating: 7 },
]

test('ทั้งหมด returns all movies', () => {
  expect(filterByYear(sample, YEAR_RANGES[0])).toHaveLength(4)
})

test('2020s returns only 2020+', () => {
  const result = filterByYear(sample, YEAR_RANGES[1])
  expect(result).toHaveLength(1)
  expect(result[0].title).toBe('A')
})

test('2010s returns 2010-2019', () => {
  const result = filterByYear(sample, YEAR_RANGES[2])
  expect(result).toHaveLength(1)
  expect(result[0].title).toBe('B')
})

test('MOVIES array is non-empty', () => {
  expect(MOVIES.length).toBeGreaterThan(0)
})
