import Papa from 'papaparse'
import axios from 'axios'
import FastestLevenshtein from 'fastest-levenshtein'

export default {
  file: 'https://server.chinesezerotohero.com/data/kengdic/kengdic_2011.tsv.txt',
  words: [],
  name: 'kengdic',
  credit() {
    return 'The Korean dictionary is provided by <a href="https://github.com/garfieldnate/kengdic">kengdic</a> created by Joe Speigle, which is freely available from its GitHub project page.'
  },
  async load() {
    let res = await axios.get(this.file)
    let results = await Papa.parse(res.data, {
      header: true
    })
    let sorted = results.data.sort((a, b) =>
      a.hangul && b.hangul ? a.hangul.length - b.hangul.length : 0
    )
    let data = []
    for(let row of sorted) {
      let word = Object.assign(row, {
        head: row.hangul,
        bare: row.hangul,
        accented: row.hangul,
        definitions: [row.english],
        cjk: {
          canonical: row.hanja && row.hanja !== 'NULL' ? row.hanja : undefined,
          phonetics: row.hungul 
        }
      })
      data.push(word)
    }
    this.words = data
    return this
  },
  unique(a) {
    return a.filter((item, i, ar) => ar.indexOf(item) === i);
  },
  getWordsThatContain(text) {
    let words = this.words.filter(w => w.head && w.head.includes(text))
    let strings = words
      .map((word) => word.head)
    return this.unique(strings)
  },
  get(id) {
    return this.words.find(row => row.id === id)
  },
  getSize() {
    return this.words.length
  },
  isChinese(text) {
    if (this.matchChinese(text)) return true
  },
  matchChinese(text) {
    return text.match(
      // eslint-disable-next-line no-irregular-whitespace
      /[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B‌​\u3400-\u4DB5\u4E00-\u9FCC\uF900-\uFA6D\uFA70-\uFAD9]+/g
    )
  },
  randomArrayItem(array, start = 0, length = false) {
    length = length || array.length
    array = array.slice(start, length)
    let index = Math.floor(Math.random() * array.length)
    return array[index]
  },
  wordForms(word) {
    let forms = [{
      table: 'head',
      field: 'head',
      form: word.bare
    }]
    return forms
  },
  stylize(name) {
    return name
  },
  lookup(text) {
    let word = this.words.find(word => word && word.bare === text)
    return word
  },
  lookupByDef(text, limit = 30) {
    text = text.toLowerCase()
    let results = this.words.filter(row => row.english && row.english.toLowerCase().includes(text)).slice(0, limit)
    return results
  },
  lookupMultiple(text) {
    let words = this.words.filter(word => word && word.bare === text)
    return words
  },
  random() {
    return this.randomArrayItem(this.words)
  },
  lookupByCharacter(char) {
    return this.words.filter(row => row.hanja && row.hanja.includes(char))
  },
  lookupHangul(hangul) {
    const candidates = this.words.filter(row => {
      return row.hangul === hangul
    })
    return candidates
  },
  accent(text) {
    return text
  },
  lookupByPattern(pattern) {
    // pattern like '～体'
    var results = []
    if (pattern.includes('～')) {
      const regexPattern = '^' + pattern.replace(/～/gi, '.+') + '$'
      const regex = new RegExp(regexPattern)
      results = this.words.filter(word => regex.test(word.hangul))
    } else {
      results = this.words.filter(word => word.hangul.includes(pattern))
    }
    return results
  },
  lookupFuzzy(text, limit = 30) {
    let words = []
    for (let word of this.words) {
      let search = word.bare
      if (search && search.length > 0) {
        let distance = FastestLevenshtein.distance(search, text);
        let max = Math.max(text.length, search.length)
        let similarity = (max - distance) / max
        words.push(Object.assign({ score: similarity }, word))
      }
    }
    words = words.sort((a, b) => b.score - a.score)
    words = this.uniqueByValue(words, 'id').slice(0, limit)
    return words
  },
  isHangul(text) {
    let regex = /[\u1100-\u11FF\u302E\u302F\u3131-\u318E\u3200-\u321E\u3260-\u327E\uA960-\uA97C\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]+/
    let isHangul = regex.test(text)
    return isHangul
  },
  async tokenize(text) {
    let t = []
    let segs = text.split(/\s+/)
    for (let seg of segs) {
      let tokenized
      if (this.isHangul(seg)) tokenized = await this.tokenizeWithOpenKoreanText(seg);
      if (tokenized) {
        for (let index in tokenized) {
          let token = tokenized[index]
          let candidates = this.lookupMultiple(
            token.text
          );
          if (token.stem && token.stem !== token.text) {
            candidates = candidates.concat(
              this.lookupMultiple(
                token.stem
              )
            );
          }
          t.push({
            text: token.text,
            candidates,
          })
        }
      } else {
        t.push(seg)
      }
      t.push(' ')
    }
    t.pop()
    return t
  },
}
