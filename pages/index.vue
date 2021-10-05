<router>
  {
    name: 'index',
    path: '/',
    meta: {
      layout: 'full'
    }
  }
</router>
<template>
  <div>
    <SocialHead
      title="PanLingo | Learn all languages in the world. Fully open-source."
      description="PanLingo is an open-source platform that helps you learn languages. We provides live TV channels, TV shows with subtitles, music with lyrics, phrasebooks with video examples... everything that can help you to learn a language “by osmosis.”"
    />
    <div
      class="container-fluid pt-4"
      style="overflow: hidden; position: relative"
    >
      <div class="container">
        <div class="row pt-5 mb-5">
          <div class="col-sm-12">
            <div class="z2h-logo" style="line-height: 1.2">
              <img
                src="/img/logo-panlingo-white.svg"
                alt="PanLingo"
                style="width: 17rem"
                data-not-lazy
              />
              <div class="mt-3" style="font-weight: 300; font-size: 1.6rem">
                Learn all languages of the world. Fully open-source.
              </div>
            </div>
          </div>
        </div>
        <div class="row" v-if="!hasDashboard">
          <div class="col-sm-12">
            <div class="intro-text mb-5 text-center">
              <p class="mb-0" style="font-size: 1.1em">
                This is heaven for language lovers. You can find dictionary
                tools, tens of thousands of videos with subtitles and other
                resources across
                <router-link
                  :to="{ name: 'language-map' }"
                  class="link-unstyled"
                  style="text-decoration: underline"
                >
                  hundreds of languages
                </router-link>
                ! Fully open-source – see
                <a
                  href="https://github.com/longjiang/zerotohero-nuxt"
                  class="link-unstyled"
                  style="text-decoration: underline"
                  target="_blank"
                >
                  our repository on GitHub
                </a>
                , and follow us on
                <a
                  href="https://twitter.com/zerotoherolang"
                  target="_blank"
                  class="link-unstyled"
                  style="text-decoration: underline"
                >
                  Twitter.
                </a>
              </p>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-sm-6 mb-5">
            <div class="home-card text-center">
              <h5 class="mb-3">Choose Languages from A Map</h5>
              <router-link to="/language-map">
                <div>
                  <img
                    src="/img/thumbnail-language-map.jpg"
                    alt="World Language Map"
                    class="rounded shadow img-fluid"
                    data-not-lazy
                  />
                </div>
              </router-link>
            </div>
          </div>
          <div class="col-sm-6 mb-5">
            <div class="home-card text-center">
              <h5 class="mb-3">Discover TV Shows Across Languages</h5>
              <router-link to="/discover-shows">
                <div>
                  <img
                    src="/img/thumbnail-discover-shows.jpg"
                    alt="Discover TV Shows Across Languages"
                    class="rounded shadow img-fluid"
                    data-not-lazy
                  />
                </div>
              </router-link>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-sm-6 mb-5">
            <div class="home-card text-center">
              <h5 class="mb-3">Compare Phrases Across Languages</h5>
              <router-link to="/compare-languages">
                <div>
                  <img
                    src="/img/thumbnail-compare-languages.jpg"
                    alt="Compare phrases across languages on a map"
                    class="rounded shadow img-fluid"
                    data-not-lazy
                  />
                </div>
              </router-link>
            </div>
          </div>
          <div class="col-sm-6 mb-5">
            <div class="home-card">
              <h5 class="mb-3 text-center">Other Interlingual Features</h5>
              <ul>
                <li class="mt-1 mb-1">
                  <router-link to="/language-icons">
                    <b>Face of the Language</b>
                  </router-link>
                  – Images of famous people who speak one of the 300 languages
                  listed.
                </li>
                <li class="mt-1 mb-1">
                  <router-link to="/translators">
                    <b>Compare Online Translators</b>
                  </router-link>
                  – Find out which online translator (e.g. Google Translate) has
                  the ability to translate which language.
                </li>
              </ul>
            </div>
          </div>
        </div>
        <client-only>
          <div class="row mb-5">
            <div class="col-sm-12">
              <div class="home-card">
                <h5 class="text-center">All 7,408 Languages</h5>
                <LanguageSwitch class="mt-3" />
                <h6 class="text-center mt-4">Some Popular Languages</h6>
                <LanguageList
                  :codes="[
                    'ar',
                    'az',
                    'bn',
                    'br',
                    'bs',
                    'bul',
                    'cat',
                    'ces',
                    'cmn',
                    'cy',
                    'dan',
                    'de',
                    'el',
                    'en',
                    'epo',
                    'es',
                    'fa',
                    'fin',
                    'fr',
                    'gle',
                    'glg',
                    'hak',
                    'he',
                    'hi',
                    'hun',
                    'hr',
                    'hye',
                    'id',
                    'isl',
                    'it',
                    'ja',
                    'ko',
                    'lat',
                    'lav',
                    'lit',
                    'lzh',
                    'msa',
                    'nan',
                    'nl',
                    'no',
                    'pa',
                    'pl',
                    'pt',
                    'ron',
                    'ru',
                    'sr',
                    'swe',
                    'ta',
                    'th',
                    'tl',
                    'tlh',
                    'tr',
                    'uk',
                    'vi',
                    'yue',
                    'zh',
                  ]"
                  class="mt-4"
                  :sort="true"
                />
              </div>
            </div>
          </div>
          <div :class="{ 'row mb-5': true, 'd-none': !hasDashboard }">
            <div class="col-sm-12">
              <div class="home-card mb-0" style="padding: 1rem">
                <h5 class="mt-3 text-center">Continue Where You Left Off</h5>
                <p class="mb-3 text-center">
                  Your data is stored in your browser, not on our server.
                </p>
                <LazyDashboard
                  @hasDashboard="hasDashboardUpdate"
                  style="padding-top: 0.5rem"
                />
              </div>
            </div>
          </div>
          <div class="row mb-5">
            <div class="col-sm-12">
              <div class="home-card">
                <h5 class="text-center">Languages by World GDP</h5>
                <LazyLanguagesGDP />
              </div>
            </div>
          </div>
        </client-only>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      hasDashboard: false,
    };
  },
  methods: {
    hasDashboardUpdate(hasDashboard) {
      this.hasDashboard = hasDashboard;
    },
  },
};
</script>

<style lang="scss" scoped>
.czh-links,
.ezh-links {
  padding: 0;
  list-style: none;
}

@media (min-width: 768px) {
  .czh-links,
  .ezh-links {
    column-count: 2;
    column-gap: 1rem;
  }
}

.czh-links a,
.ezh-links a {
  color: #333;
}

.ezh-links a {
  font-size: 0.9em;
}

.z2h-logo {
  color: white;
  text-align: center;
  display: block;
  -webkit-filter: drop-shadow(0 0 20px rgba(0, 0, 0, 0.7));
  filter: drop-shadow(0 0 20px rgba(0, 0, 0, 0.7));
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
}

.z2h-slogan {
  max-height: 10rem;
  position: absolute;
  right: 1rem;
  -webkit-filter: drop-shadow(0 0 20px rgba(0, 0, 0, 0.7));
  filter: drop-shadow(0 0 20px rgba(0, 0, 0, 0.7));
}

.czh-logo,
.ezh-logo {
  width: 12rem;
  max-width: 75%;
  display: block;
}

.intro-text {
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 2rem;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid hsla(0deg, 0%, 30%, 0.7);
  border-radius: 1rem;
  text-align: left;
}

.sale-card {
  border-radius: 1rem;
  background-image: url(/img/background-spring-sale.png);
  background-size: cover;
  padding: 3rem;
  text-align: center;
  color: #fcddc1;
}

.sale-card code {
  border-radius: 0.5rem;
  padding: 0.5rem;
  color: #004a5c;
  background-color: #fcddc1;
  font-weight: bold;
}
</style>