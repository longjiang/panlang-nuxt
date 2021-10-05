import Papa from 'papaparse'
import axios from 'axios'
import Helper from '@/lib/helper'
import Translators from '@/lib/translators'
import translations from './translations'

export default {
  l1s: [],
  translations,
  youTubeLangs: 'aa ab af akk am ar arc as ase ay az ba be bg bh bi bn bo br brx bs ca cho chr co cop cr cs cy da de-AT de-CH de-DE de doi dz el en-CA en-GB en-IE en-IN en-US en eo es-419 es-ES es-MX es-US es et eu fa-AF fa-IR fa ff fi fil fj fo fr-BE fr-CA fr-CH fr-FR fr fy ga gd gl gn grc gu ha hak-TW hak haw hbo he hi-Latn hi ho hr ht hu hy ia id ie ig ik is it iu iw ja jv ka kk kl km kn ko kok ks ku ky la lad lb ln lo lt lus lv mai mas mg mi mk ml mn-Mong mn mni mo mr ms mt my na nan-TW nan nb ne nl-BE nl-NL nl nn no nv oc om or pa pap pl ps pt-BR pt-PT pt qu rm rn ro ru-Latn ru rw sa sat sc scn sd sdp sg sh si sk sl sm sn so sq sr-Cyrl sr-Latn sr ss st su sv sw ta te tg th ti tk tl tlh tn to tpi tr ts tt tw ug uk ur uz ve vi vo vro wo xh yi yo yue-HK yue zh-CN zh-Hans zh-Hant zh-HK zh-SG zh-TW zh zu'.split(' '),
  liveTVLangs: 'amh ara aze bak ben bos bul cat ces cmn cnr dan deu ell eng est fas fra fry glg heb hin hrv hun hye iku ind isl ita jpn kan kat kaz kin kor kur lao lav lit ltz mal mkd mlt mri nan nep nld nor pan pol por pus ron rus sin slk slv som spa sqi srp swe tam tel tgl tha tur ukr urd vie yue zho'.split(' '),
  async load(limitToCodes = undefined) {
    console.log('Loading language data...')
    let features = this.loadCSVString(data.features)
    let locales = this.loadCSVString(data.locales)
    let hours = this.loadCSVString(data.hours)
    let countries = await this.loadCSVFile(`${process.env.baseUrl}/data/languages/countries.csv.txt`)
    countries = countries.map((row) => {
      row.languages = row.languages ? row.languages.split(",") : [];
      return row;
    });
    let languages = await this.loadCSVFile(`${process.env.baseUrl}/data/languages/languages.csv.txt`)
    if (typeof limitToCodes !== 'undefined' && limitToCodes[0]) {
      limitToCodes.push('en')
      languages = languages.filter(l => limitToCodes.includes(l['iso639-1']) || limitToCodes.includes(l['iso639-3']))
    }
    let omniglot = await this.loadCSVFile(`${process.env.baseUrl}/data/languages/omniglot.csv.txt`)
    let dictionaries = this.loadCSVString(data.dictionaries)
    let scripts = await this.loadCSVFile(`${process.env.baseUrl}/data/languages/scripts.csv.txt`)
    let wiktionary_mapped_langs = data.wiktionary_mapped_langs.split(' ')
    let filteredLanguages = this.filterLanguages(languages)
    this.l1s = this.constructL1Data(filteredLanguages, { features, locales, scripts, hours, countries, scripts, wiktionary_mapped_langs, dictionaries, omniglot })
    return this
  },
  async loadCSVFile(url) {
    let res = await axios.get(url)
    if (res && res.data) {
      return this.loadCSVString(res.data)
    }
  },
  loadCSVString(csv, header = true) {
    if (typeof Papa !== 'undefined') {
      let r = Papa.parse(csv, {
        header: header
      })
      return r.data
    }
  },
  filterLanguages(languages) {
    console.log(`Filtering through ${languages.length} languages...`)
    let filteredLanguages = languages.filter(l => {
      if (l.wiktionary) return true
      if (l.type === 'L') return true
      if (l.logo) return true
      if (['hbo', 'enm', 'arc', 'grc', 'sjn'].includes(l['iso639-3'])) return true
      if (l['glottologFamilyId'] === 'sino1245') return true
    })
    console.log(`Left with ${filteredLanguages.length} languages...`)
    return filteredLanguages
  },
  constructL1Data(languages, { features = [], locales = [], scripts = [], hours = [], countries = [], wiktionary_mapped_langs = [], dictionaries = [], omniglot = [] } = {}) {
    /*
     Goal:
    {
      "code": "af",
      "iso639-1": "af",
      "iso639-3": "afr",
      "name": "Afrikaans",
      "direction": 'ltr',
      "dictionaries": {
        "eng": ["freedict"] // means we have a dictionary with L1 as Afrikaans and L2 as English
      },
      "locales": ['zh-CN', 'zh-HK']
      "published": true,
      "translations": {
        "english": "Engels",
        "zerotohero": "Nul tot held"
      },
      "features": {
        "eng": [ "home", "courses" ] // means we have the "home" feature if you are studing English through Afrikaans
      }
    },
     */
    console.log('Constructing L1 Data...')
    let l1s = languages.map(language => {
      let additional = {
        code: this.code(language),
        direction: language.direction || 'ltr',
        published: true
      }
      let obj = Object.assign(additional, language)
      if (obj.id) obj.id = Number(obj.id);
      if (obj.lat) obj.lat = Number(obj.lat);
      if (obj.long) obj.long = Number(obj.long);
      if (obj.speakers) obj.speakers = Number(obj.speakers);
      if (obj.wiktionary) obj.wiktionary = Number(obj.wiktionary);
      if (obj.otherNames) obj.otherNames = obj.otherNames.split(', ')
      obj.name = this.renameLanguage(language.name)
      obj.country = countries.filter(c => language.country.split(' ').includes(c.alpha2Code))
      return obj
    })
    console.log('Augmenting, adding locales, adding host country locales...')
    for (let l1 of l1s) {
      this.augmentLanguage(l1, { scripts, omniglot, hours })
      this.addLocales(l1, locales)
      this.addHostCountryLocales(l1, locales)
    }
    console.log('Adding identical languages information, assigning dictionaries, loading language feature list...')
    this.addIdenticalLangs(l1s)
    this.assignDictionaries(l1s, { dictionaries, wiktionary_mapped_langs })
    this.loadL1Features(l1s, features)
    console.log('Language-loading finished. 🍺')
    return l1s
  },
  renameLanguage(name) {
    name = name.replace(/ \(.*\)/, '')
    for (let rename of [
      ["Modern ", ""],
      [" Standard", ""],
      ["Yue Chinese", "Cantonese"],
      ['Oriya', 'Odia'],
      ['Eastern Panjabi', 'Punjabi'],
      ['Panjabi', 'Punjabi']
    ]) {
      name = name.replace(rename[0], rename[1])
    }
    return name
  },
  augmentLanguage(l1, { scripts = [], omniglot = [], hours = [] } = {}) {
    l1.translators = {} // This is needed for translators to be added
    l1.apostrophe = ['tlh', 'cy', 'uz', 'br', 'tl', 'ceb', 'hy'].includes(l1.code)
    l1.han = 'cdo cjy cmn cnp cpx csp czo hak hsn ltc lzh mnp nan och wuu yue zho'.split(' ').includes(l1['iso639-3']) || ['leiz1236', 'hain1238'].includes(l1.glottologId)
    l1.continua = l1.han || ['th', 'lo', 'ja', 'km', 'ryu', 'bo', 'my', 'dz'].includes(l1.code)
    l1.scripts = scripts.filter(script => script.lang === l1.code && script.ms !== 'N')
    if (l1.scripts[0]) l1.direction = l1.scripts[0].direction
    let l1Omniglot = omniglot.find(item => item['iso639-3'] === l1['iso639-3'])
    if (l1Omniglot) {
      l1.omniglot = l1Omniglot.url
    }
    let l1hours = hours.find(item => item['iso639-3'] === l1['iso639-3'])
    if (l1hours) {
      l1.hours = l1hours.hours
    }
    if (this.translations[l1['iso639-3']]) l1.translations = this.translations[l1['iso639-3']]
    l1.agglutinative = this.isAgglutinative(l1)
    l1.indo = this.isIndo(l1)
  },
  isIndo(l1) {
    return ['aee',
      'aeq',
      'anp',
      'anr',
      'asm',
      'awa',
      'bdv',
      'ben',
      'bfb',
      'bfy',
      'bfz',
      'bgc',
      'bgd',
      'bge',
      'bgq',
      'bgw',
      'bha',
      'bhb',
      'bhd',
      'bhe',
      'bhi',
      'bho',
      'bht',
      'bhu',
      'bjj',
      'bkk',
      'bmj',
      'bns',
      'bpx',
      'bpy',
      'bra',
      'btv',
      'ccp',
      'cdh',
      'cdi',
      'cdj',
      'cih',
      'clh',
      'ctg',
      'dcc',
      'dgo',
      'dhd',
      'dhn',
      'dho',
      'dhw',
      'div',
      'dmk',
      'dml',
      'doi',
      'dry',
      'dty',
      'dub',
      'duh',
      'dwz',
      'gas',
      'gbk',
      'gbl',
      'gbm',
      'gda',
      'gdx',
      'ggg',
      'ghr',
      'gig',
      'gjk',
      'gju',
      'glh',
      'gom',
      'gra',
      'guj',
      'gwc',
      'gwf',
      'gwt',
      'haj',
      'hca',
      'hif',
      'hii',
      'hin',
      'hkh',
      'hlb',
      'hnd',
      'hne',
      'hno',
      'hns',
      'hoj',
      'jat',
      'jdg',
      'jml',
      'jnd',
      'jns',
      'kas',
      'kbu',
      'keq',
      'key',
      'kfr',
      'kfs',
      'kft',
      'kfu',
      'kfv',
      'kfx',
      'kfy',
      'khn',
      'khw',
      'kjo',
      'kls',
      'knn',
      'kra',
      'ksy',
      'kvx',
      'kxp',
      'kyw',
      'lbm',
      'lhl',
      'lmn',
      'lss',
      'luv',
      'mag',
      'mai',
      'mar',
      'mby',
      'mjl',
      'mjz',
      'mkb',
      'mke',
      'mki',
      'mtr',
      'mup',
      'mve',
      'mvy',
      'nag',
      'nep',
      'nhh',
      'nli',
      'nlm',
      'nlx',
      'noe',
      'noi',
      'npi',
      'odk',
      'omr',
      'ort',
      'ory',
      'pan',
      'paq',
      'pcl',
      'pgg',
      'phd',
      'phl',
      'phr',
      'pli',
      'plk',
      'plp',
      'pmh',
      'pmu',
      'pnb',
      'psh',
      'psi',
      'psu',
      'pwr',
      'qpp',
      'rei',
      'rhg',
      'rjs',
      'rkt',
      'rmc',
      'rme',
      'rmf',
      'rmi',
      'rml',
      'rmn',
      'rmo',
      'rmq',
      'rmt',
      'rmw',
      'rmy',
      'rom',
      'rtw',
      'rwr',
      'san',
      'saz',
      'sbn',
      'sck',
      'scl',
      'sdg',
      'sdr',
      'sgj',
      'shd',
      'sin',
      'sjp',
      'skr',
      'smm',
      'smv',
      'snd',
      'soi',
      'spv',
      'srx',
      'ssi',
      'sts',
      'swv',
      'syl',
      'tdb',
      'the',
      'thl',
      'thq',
      'thr',
      'tkb',
      'tkt',
      'tnv',
      'tra',
      'trw',
      'urd',
      'ush',
      'vaa',
      'vah',
      'vas',
      'vav',
      'ved',
      'vgr',
      'wbr',
      'wry',
      'wsv',
      'wtm',
      'xhe',
      'xka',
      'xnr'].includes(l1['iso639-3'])
  },
  isAgglutinative(l1) {
    // https://en.wikipedia.org/wiki/Agglutinative_language
    if ([
      'abkh1242', // https://en.wikipedia.org/wiki/Northwest_Caucasian_languages
      'algo1256', // https://en.wikipedia.org/wiki/Algonquian_languages
      'arau1255', // https://en.wikipedia.org/wiki/Araucanian_languages
      'araw1281', // https://en.wikipedia.org/wiki/Arawakan_languages
      'atha1247', // https://en.wikipedia.org/wiki/Athabaskan_languages
      'aust1307', // https://en.wikipedia.org/wiki/Austronesian_languages
      'ayma1253', // https://en.wikipedia.org/wiki/Aymaran_languages
      'azte1234', // https://en.wikipedia.org/wiki/Nahuatl
      'berb1260', // https://en.wikipedia.org/wiki/Berber_languages
      'drav1251', // https://en.wikipedia.org/wiki/Dravidian_languages
      'eski1264', // https://en.wikipedia.org/wiki/Eskimo%E2%80%93Aleut_languages
      'iroq1247', // https://en.wikipedia.org/wiki/Iroquoian_languages
      'kart1248', // https://en.wikipedia.org/wiki/Kartvelian_languages
      'kass1244', // https://en.wikipedia.org/wiki/Kassite_language
      'mong1329', // https://en.wikipedia.org/wiki/Mongolic_languages
      'mund1335', // https://en.wikipedia.org/wiki/Munda_languages
      'musk1252', // https://en.wikipedia.org/wiki/Muskogean_languages
      'nakh1245', // https://en.wikipedia.org/wiki/Northeast_Caucasian_languages
      'narr1281', // https://en.wikipedia.org/wiki/Bantu_languages
      'quec1387', // https://en.wikipedia.org/wiki/Quechuan_languages
      'sali1255', // https://en.wikipedia.org/wiki/Salishan_languages
      'siou1252', // https://en.wikipedia.org/wiki/Siouan_languages
      'tung1282', // https://en.wikipedia.org/wiki/Tungusic_languages
      'tupi1275', // https://en.wikipedia.org/wiki/Tupian_languages
      'turk1311', // https://en.wikipedia.org/wiki/Turkic_languages
      'ural1272', // https://en.wikipedia.org/wiki/Uralic_languages
    ].includes(l1.glottologFamilyId)) return true
    if ([
      'akk', // https://en.wikipedia.org/wiki/Akkadian_language
      'bod', // https://en.wikipedia.org/wiki/Lhasa_Tibetan
      'cnh', // https://en.wikipedia.org/wiki/Hakha_Chin_language
      'elx', // https://en.wikipedia.org/wiki/Elamite_language
      'eus', // https://en.wikipedia.org/wiki/Basque_language
      'hus', // https://en.wikipedia.org/wiki/Huastec_language
      'jpn',
      'kor',
      'lus', // https://en.wikipedia.org/wiki/Mizo_language
      'sux', // https://en.wikipedia.org/wiki/Sumerian_language
      'xct', // https://en.wikipedia.org/wiki/Classical_Tibetan
      'xht', // https://en.wikipedia.org/wiki/Hattic_language
      'yuc', // https://en.wikipedia.org/wiki/Yuchi_language
    ].includes(l1['iso639-3'])) return true
    return false
  },
  addLocales(l1, locales) {
    let l1Locales = []
    if (l1['iso639-1']) l1Locales = l1Locales.concat(l1.code)
    l1Locales = l1Locales.concat(locales.filter(l => l.code === l1.code).map(l => l.locale))
    if (l1.han) {
      l1Locales = l1Locales.concat([
        'zh',
        'zh-CN',
        'zh-Hans',
        'zh-Hant',
        'zh-SG',
        'zh-TW',
        'zh-HK'])
    }
    l1Locales = Helper.unique(l1Locales)
    l1.locales = l1Locales
  },
  addIdenticalLangs(l1s) {
    let groups = [
      ['ara', 'arb'],
      ['arc', 'syc', 'syr'],
      ['aze', 'azj'],
      ['bul', 'mkd'],
      ['est', 'ekk'],
      ['fas', 'pes', 'prs'],
      ['ful', 'fuv'],
      ['hbs', 'srp', 'bos', 'hrv', 'cnr'],
      ['ins', 'pks', 'wbs'],
      ['kur', 'ckb'],
      ['kpe', 'gkp', 'xpe'], // Kapelle: Guinea and Liberia
      ['lav', 'lvs'],
      ['msa', 'zlm', 'zsm'],
      ['mwr', 'mve', 'rwr'],
      ['nor', 'nob', 'nno'],
      ['nep', 'npi'],
      ['orm', 'gax'],
      ['ori', 'ory'],
      ['mlg', 'plt'],
      ['pus', 'pbu'],
      ['sme', 'sma', 'sju', 'sje', 'smj', 'sjk', 'smn', 'sms', 'sia', 'sjd', 'sjt'],
      ['swa', 'swh'],
      ['uzb', 'uzn'],
      ['zho', 'cmn'],
    ]
    for (let group of groups) {
      let languages = group.map(code => l1s.find(l => l['iso639-3'] === code)).filter(l => l)
      for (let language of languages) {
        language.identicalLangs = languages.filter(l => l !== language)
        let localesFromIdenticalLangs = []
        for (let lang of language.identicalLangs) {
          // console.log(lang.name, lang.locales)
          localesFromIdenticalLangs = localesFromIdenticalLangs.concat(lang.locales)
        }
        if (language.locales && language['iso639-3'] === group[0]) language.locales = Helper.unique(language.locales.concat(localesFromIdenticalLangs))
      }
    }

  },
  addHostCountryLocales(l1, locales) {
    let hostCountryLocales = []
    let l1Locales = l1.locales
    if (!this.youTubeLangs.includes(l1Locales[0]) && l1['iso639-3']) {
      if (l1.country && l1.country[0]) {
        let country = l1.country[0]
        if (country.languages && country.languages[0]) {
          let countryPrimaryLanguageCode = country.languages[0]
          let countryPrimaryLanguageLocales = locales.filter(l => l.code === countryPrimaryLanguageCode).map(l => l.locale)
          hostCountryLocales = [countryPrimaryLanguageCode, ...countryPrimaryLanguageLocales]
        }
        if (country.name === "Philippines") hostCountryLocales.push('fil')
        hostCountryLocales = Helper.unique(hostCountryLocales)
      }
    }
    l1.hostCountryLocales = hostCountryLocales
  },
  assignDictionaries(l1s, { dictionaries = [], wiktionary_mapped_langs = [] } = {}) {
    for (let dictionary of dictionaries) {
      let l1 = l1s.find(language => language['iso639-3'] === dictionary.l1)
      if (typeof l1 !== 'undefined') {
        l1.dictionaries = l1.dictionaries || {}
        l1.dictionaries[dictionary.l2] = l1.dictionaries[dictionary.l2] || []
        l1.dictionaries[dictionary.l2].push(dictionary.dictionary) // "freedict"
      }
    }
    let english = l1s.find(l1 => l1.code === 'en')
    let wiktionary_langs = l1s.filter(l => l.wiktionary).map(l => l['iso639-3'])
    let all_wiktionary_langs = wiktionary_langs.concat(wiktionary_mapped_langs)
    for (let lang of all_wiktionary_langs) {
      english.dictionaries[lang] = english.dictionaries[lang] || []
      english.dictionaries[lang].push('wiktionary')
    }
    english.dictionaries['leiz1236'] = ['hsk-cedict']
    english.dictionaries['hain1238'] = ['hsk-cedict']
  },
  loadL1Features(l1s, features) {
    /*
     Goal:
    {
      "code": "af",
      ...
      "features": {
        "eng": [ "home", "courses" ] // means we have the "home" feature if you are studing English through Afrikaans
      }
    },
     */
    console.log('Loading language features.')
    for (let row of features) {
      let l1 = l1s.find(language => language['iso639-3'] === row.l1)
      if (l1) {
        l1.features = l1.features || {}
        l1.features[row.l2] = l1.features[row.l2] || []
        for (let key in row) {
          // key = 'home'
          if (key !== 'l1' && key !== 'l2' && row[key] === 'TRUE') {
            l1.features[row.l2].push(key) // key = 'home'
          }
        }
      }
    }
    console.log('Features loaded.')
  },
  translationURL(text, l1, l2) {
    let translator = this.getTranslator(l1, l2)
    if (typeof translator !== 'undefined') {
      return translator.getTranslationURL(text, l1, l2)
    }
  },
  getTranslator(l1, l2) {
    if (typeof l1.translators[l2.code] === 'undefined') {
      l1.translators[l2.code] = Translators.get(l1, l2)
    }
    return l1.translators[l2.code]
  },
  get(iso639_3) {
    if (iso639_3) return this.l1s.find(language => language['iso639-3'] === iso639_3)
  },
  getById(id) {
    return this.l1s.find(l1 => l1.id === Number(id))
  },
  getSmart(code) {
    return this.l1s.find(
      language =>
        language['iso639-1'] === code || language['iso639-3'] === code || language['glottologId'] === code
    )
  },
  hasFeature(l1, l2, feature) {
    return this.getFeatures(
      {
        l1,
        l2,
      },
      process.browser
    )
      .includes(feature);
  },
  hasYouTube(l1, l2) {
    // l1.code = 'ceb', l2.code = 'en' -> yes, becuase we can find English YouTube videos, with sub translated in cebuano 
    // l1.code = 'en', l2.code = 'ceb' -> no, because we can't FIND cebuano subtitlted YouTube videos
    if (l2.code === 'ceb') return true
    if (l2.code === 'crh') return true
    if (l2.code === 'lzh') return true // Literary Chinese
    if (l2.code === 'cmn') return true // Mandarin
    let youTubeLangs = this.youTubeLangs.filter(l => [l2.code, ...l2.locales, ...l2.hostCountryLocales].includes(l))
    return youTubeLangs.length > 0
  },
  code(language) {
    return language['iso639-1'] || language['iso639-3'] || language['glottologId']
  },
  getFeatures({ l1, l2 }, browser) {
    let features = l1.features && l1.features[l2['iso639-3']]
      ? [].concat(l1.features[l2['iso639-3']])
      : []
    if (l1.dictionaries && (l1.dictionaries[l2['iso639-3'] || l2['glottologId']])) {
      if (!features.includes('dictionary')) features.push('dictionary')
    }
    if (this.hasYouTube(l1, l2)) {
      if (!features.includes('youtube')) features.push('youtube')
    }
    if (this.liveTVLangs.includes(l2['iso639-3'])) features.push('live-tv')
    if (browser) {
      let speechCodes = [l2.code]
      let additionalCodes = {
        'ms': ['id', 'id-ID'],
        'yue': ['zh-HK']
      }
      for (let c in additionalCodes) {
        if ((l2.code) === c) {
          speechCodes = speechCodes.concat(additionalCodes[c])
        }
      }
      if (l2.locales) speechCodes = speechCodes.concat(l2.locales)
      if (l2.han && !['yue', 'zh'].includes(l2.code)) speechCodes = [l2.code] // So that 'wuu', 'hak' does not get Mandarin speech
      let voices = speechSynthesis.getVoices().filter(voice => speechCodes.includes(voice.lang))
      if (voices.length > 0) {
        if (!features.includes('speech')) features.push('speech')
      }
    }
    if (l2.scripts && l2.scripts.length > 0 && l2.scripts[0].script !== 'Latn' && l2.scripts[0].script !== 'Zzzz') {
      if (!features.includes('transliteration')) features.push('transliteration')
    }
    if (l2.han && !features.includes('transliteration')) features.push('transliteration')
    if (l2.omniglot) {
      if (!features.includes('omniglot')) features.push('omniglot')
    }
    return features
  },
  logo(code) {
    if (code === 'en') {
      return `/img/ezh-icon.png`
    } else if (code === 'zh') {
      return `/img/czh-icon.png`
    } else {
      return `/img/logo-square/${code}.jpeg`
    }
  },
  isDescendant(child, ancestor) {
    let parent = this.parent(child)
    while (parent) {
      if (parent === ancestor) return true
      else parent = this.parent(parent)
    }
  },
  parent(language) {
    let parent = this.l1s.find(l => l.glottologId === language.glottologParentId)
    if (parent !== language) return parent
  },
}

const data = {
  hours: `name,iso639-3,hours,B2,B1,A1,A1,PreA1
Afrikaans,afr,600,300,150,75,37.5,18.75
Esperanto,epo,600,300,150,75,37.5,18.75
Danish,dan,600,300,150,75,37.5,18.75
Northern Frisian,frr,600,300,150,75,37.5,18.75
Western Frisian,fry,600,300,150,75,37.5,18.75
Gronings,gos,600,300,150,75,37.5,18.75
Italian,ita,600,300,150,75,37.5,18.75
Low German,nds,600,300,150,75,37.5,18.75
Dutch,nld,600,300,150,75,37.5,18.75
Norwegian,nor,600,300,150,75,37.5,18.75
Plautdietsch,pdt,600,300,150,75,37.5,18.75
Portuguese,por,600,300,150,75,37.5,18.75
Romanian,ron,600,300,150,75,37.5,18.75
Scots,sco,600,300,150,75,37.5,18.75
Spanish,spa,600,300,150,75,37.5,18.75
Saterfriesisch,stq,600,300,150,75,37.5,18.75
Swedish,swe,600,300,150,75,37.5,18.75
Westphalien,wep,600,300,150,75,37.5,18.75
French,fra,750,375,187.5,93.75,46.875,23.4375
German,deu,900,450,225,112.5,56.25,28.125
Haitian Creole,hat,900,450,225,112.5,56.25,28.125
Indonesian,ind,900,450,225,112.5,56.25,28.125
Malay,msa,900,450,225,112.5,56.25,28.125
Swahili,swa,900,450,225,112.5,56.25,28.125
Yiddish,yid,900,450,225,112.5,56.25,28.125
Amharic,amh,1100,550,275,137.5,68.75,34.375
Azerbaijani,aze,1100,550,275,137.5,68.75,34.375
Bengali,ben,1100,550,275,137.5,68.75,34.375
Tibetan,bod,1100,550,275,137.5,68.75,34.375
Bulgarian,bul,1100,550,275,137.5,68.75,34.375
Czech,ces,1100,550,275,137.5,68.75,34.375
Greek,ell,1100,550,275,137.5,68.75,34.375
Estonian,est,1100,550,275,137.5,68.75,34.375
Persian,fas,1100,550,275,137.5,68.75,34.375
Finnish,fin,1100,550,275,137.5,68.75,34.375
Serbo-Croatian,hbs,1100,550,275,137.5,68.75,34.375
Hebrew,heb,1100,550,275,137.5,68.75,34.375
Hindi,hin,1100,550,275,137.5,68.75,34.375
Hungarian,hun,1100,550,275,137.5,68.75,34.375
Armenian,hye,1100,550,275,137.5,68.75,34.375
Icelandic,isl,1100,550,275,137.5,68.75,34.375
Georgian,kat,1100,550,275,137.5,68.75,34.375
Kazakh,kaz,1100,550,275,137.5,68.75,34.375
Khmer,khm,1100,550,275,137.5,68.75,34.375
Kyrgyz,kir,1100,550,275,137.5,68.75,34.375
Kurdish,kur,1100,550,275,137.5,68.75,34.375
Lao,lao,1100,550,275,137.5,68.75,34.375
Latvian,lav,1100,550,275,137.5,68.75,34.375
Lithuanian,lit,1100,550,275,137.5,68.75,34.375
Macedonian,mkd,1100,550,275,137.5,68.75,34.375
Mongolian,mon,1100,550,275,137.5,68.75,34.375
Burmese,mya,1100,550,275,137.5,68.75,34.375
Nepali,nep,1100,550,275,137.5,68.75,34.375
Polish,pol,1100,550,275,137.5,68.75,34.375
Dari,prs,1100,550,275,137.5,68.75,34.375
Russian,rus,1100,550,275,137.5,68.75,34.375
Sinhala,sin,1100,550,275,137.5,68.75,34.375
Slovak,slk,1100,550,275,137.5,68.75,34.375
Slovenian,slv,1100,550,275,137.5,68.75,34.375
Somali,som,1100,550,275,137.5,68.75,34.375
Albanian,sqi,1100,550,275,137.5,68.75,34.375
Tamil,tam,1100,550,275,137.5,68.75,34.375
Telugu,tel,1100,550,275,137.5,68.75,34.375
Tajik,tgk,1100,550,275,137.5,68.75,34.375
Tagalog,tgl,1100,550,275,137.5,68.75,34.375
Thai,tha,1100,550,275,137.5,68.75,34.375
Turkmen,tuk,1100,550,275,137.5,68.75,34.375
Turkish,tur,1100,550,275,137.5,68.75,34.375
Ukrainian,ukr,1100,550,275,137.5,68.75,34.375
Urdu,urd,1100,550,275,137.5,68.75,34.375
Uzbek,uzb,1100,550,275,137.5,68.75,34.375
Vietnamese,vie,1100,550,275,137.5,68.75,34.375
English,eng,1765,882.5,441.25,220.625,110.3125,55.15625
Arabic,ara,2200,1100,550,275,137.5,68.75
Japanese,jpn,2200,1100,550,275,137.5,68.75
Korean,kor,2200,1100,550,275,137.5,68.75
Yue Chinese,yue,2200,1100,550,275,137.5,68.75
Chinese,zho,2200,1100,550,275,137.5,68.75
Hakkak,hak,2200,1100,550,275,137.5,68.75
Cantonese,yue,2200,1100,550,275,137.5,68.75
Min Nan,nan,2200,1100,550,275,137.5,68.75`,
  locales: `code,locale
ar,ar-SA
azj,az
ceb,fil
ceb,fil-PH
cmn,zh
cmn,zh-CN
cmn,zh-Hans
cmn,zh-Hant
cmn,zh-TW
cmn,zh-SG
ckb,ku
crh,tr
da,da-DK
de,de-AT
de,de-CH
de,de-DE
el,el-GR
en,en-AU
en,en-CA
en,en-GB
en,en-IE
en,en-IN
en,en-US
en,en-ZA
es,es-419
es,es-AR
es,es-ES
es,es-MX
es,es-US
fa,fa-AF
fa,fa-IR
fi,fi-FI
fr,fr-BE
fr,fr-CA
fr,fr-CH
fr,fr-FR
gax,om
grc,el
hak,hak-TW
hak,zh
hak,zh-CN
hak,zh-Hans
hak,zh-Hant
hak,zh-SG
hak,zh-TW
hak,zh-HK
hbo,he
hbo,he-IL
hbo,iw
he,he-IL
he,iw
hi,hi-IN
hi,hi-Latn
hil,fil
hil,fil-PH
hu,hu-HU
id,id-ID
ins,en
ins,en-IN
it,it-IT
ja,ja-JP
ko,ko-KR
lzh,zh
lzh,zh-CN
lzh,zh-Hans
lzh,zh-TW
lzh,zh-SG
lzh,zh-HK
mhx,my
min,ms
min,id
mve,mwr
nan,zh
nan,nan-TW
nan,zh-TW
nan,zh-CN
nan,zh-Hans
nan,zh-Hant
nb,nb-NO
nep,ne
nl,nl-BE
nl,nl-NL
no,nb
no,nb_NO
no,nn
no,nn_NO
nb,nb_NO
nn,nn_NO
pbu,ps
prs,fa
prs,ps
pl,pl-PL
pt,pt-BR
pt,pt-PT
plt,mg
ro,ro-RO
ru,ru-Latn
ru,ru-RU
rwr,mwr
ryu,ja
sk,sk-SK
sr,sr-Cyrl
sr,sr-Latn
sv,sv-SE
swh,sw
th,th-TH
tl,fil
tl,fil-PH
tr,tr-TR
ug,tr
ug,tr-TR
ydd,yi
yue,zh
yue,yue-HK
yue,zh-CN
yue,zh-Hans
yue,zh-Hant
yue,zh-HK
yue,zh-SG
zh,zh-CN
zh,zh-Hans
zh,zh-Hant
zh,zh-HK
zh,zh-SG
zh,zh-TW
zlm,ms`,
  features: `l1,l2,home,courses,keyboard,bookmarklet,levels,roots,explore-topics,related,learn,grammar,noun-cases,endings,analyzer,hero-academy,music,radicals,characters
eng,zho,TRUE,TRUE,,,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,,,,TRUE,TRUE,TRUE,TRUE
zho,eng,TRUE,TRUE,,,,,,,,,,,,,,,
eng,tlh,,,TRUE,,,,,,,,,,,,,,
eng,hin,,,,TRUE,,,,,,,,,,,,,
eng,rus,,,,,,,,,,,TRUE,TRUE,TRUE,,,,`,
  dictionaries: `l2	l1	dictionary
eng	zho	ecdict
jpn	eng	edict
eng	afr	freedict
eng	ara	freedict
eng	ell	freedict
eng	fin	freedict
eng	fra	freedict
eng	gle	freedict
eng	hin	freedict
eng	hrv	freedict
eng	hun	freedict
eng	ita	freedict
eng	jpn	freedict
eng	lat	freedict
eng	nld	freedict
eng	pol	freedict
eng	por	freedict
eng	ron	freedict
eng	rus	freedict
eng	spa	freedict
eng	srp	freedict
eng	swa	freedict
eng	swe	freedict
eng	tur	freedict
cdo	eng	hsk-cedict
cjy	eng	hsk-cedict
cnp	eng	hsk-cedict
cpx	eng	hsk-cedict
csp	eng	hsk-cedict
czo	eng	hsk-cedict
gan	eng	hsk-cedict
hak	eng	hsk-cedict
hsn	eng	hsk-cedict
ltc	eng	hsk-cedict
ltc	zho	hsk-cedict
lzh	eng	hsk-cedict
lzh	zho	hsk-cedict
mnp	eng	hsk-cedict
nan	eng	hsk-cedict
och	eng	hsk-cedict
och	zho	hsk-cedict
wuu	eng	hsk-cedict
zha	eng	hsk-cedict
zho	eng	hsk-cedict
yue	eng	dialect-dict
hak	zho	dialect-dict
nan	zho	dialect-dict
kor	eng	kengdic
tlh	eng	klingonska
rus	eng	openrussian`,
  freedict_backup: `l2	l1	dictionary
slk	eng	freedict
ady	eng	freedict
afr	eng	freedict
ast	eng	freedict
deu	eng	freedict
hrv	eng	freedict
hun	eng	freedict
isl	eng	freedict
kur	eng	freedict
lit	eng	freedict`,
  wiktionary_mapped_langs: 'bos grc hbo hmn hrv nor nsl run srp',
}