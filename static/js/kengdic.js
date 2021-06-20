const Dictionary = {
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
    for (let row of sorted) {
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
  unique(array) {
    var uniqueArray = []
    for (let i in array) {
      if (!uniqueArray.includes(array[i])) uniqueArray.push(array[i])
    }
    return uniqueArray
  },
  get(id) {
    return this.words.find(row => row.id === id)
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
  lookupFuzzy(text, limit = 30) { // text = 'abcde'
    text = text.toLowerCase().trim()
    if (this.isChinese(text)) {
      let results = this.words.filter(row => row.hanja && row.hanja.includes(text))
      return results
    } else {
      let words = []
      let subtexts = []
      for (let i = 1; text.length - i > 0; i++) {
        subtexts.push(text.substring(0, text.length - i))
      }
      for (let word of this.words) {
        let head = word.head ? word.head.toLowerCase() : undefined
        if (head && head === text) {
          // match 'abcde' exactly
          words.push(
            Object.assign(
              { score: 99999 },
              word
            )
          )
        } else if (head && head.startsWith(text)) {
          // match 'abcdejkl', 'abcdexyz', etc
          words.push(
            Object.assign(
              { score: text.length - (head.length - text.length) },
              word
            )
          )
        } else if (head && text.startsWith(head)) {
          // matches 'abcde', 'abcd', 'abc', etc
          words.push(Object.assign({ score: head.length + 1 }, word))
        } else if (head && text.includes(head)) {
          // matches 'abc', 'bcd', 'cde', etc
          words.push(Object.assign({ score: head.length }, word))
        } else {
          // matches 'abcdxyz', 'abcxyz', 'abxyz', etc
          for (let subtext of subtexts) {
            if (head && head.startsWith(subtext)) {
              let daBonus = 0
              if (head.length > 1 && head.endsWith('다')) daBonus++
              if (head.length > 1 && head.endsWith('하다')) daBonus++
              words.push(
                Object.assign(
                  { score: subtext.length - (head.length - subtext.length) + daBonus },
                  word
                )
              )
            }
          }
        }
      }
      return words.sort((a, b) => b.score - a.score).slice(0, limit)
    }
  },
  lookupMultiple(text) {
    let words = this.words.filter(word => word && (word.bare === text || word.hanja === text))
    return words
  },
  async tokenizeWithOpenKoreanText(seg) {
    let res = await axios.get(`http://localhost:4567/tokenize?text=${seg}`)
    if (res.data) {
      return res.data.tokens
    }
  },
  async tokenize(text) {
    let t = []
    let segs = text.split(/\s+/)
    for (let seg of segs) {
      let tokenized = await this.tokenizeWithOpenKoreanText(seg);
      for (let index in tokenized) {
        let token = tokenized[index]
        console.log(token)
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
      t.push(' ')
    }
    t.pop()
    return t
  },
}