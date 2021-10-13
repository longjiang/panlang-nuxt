<template>
  <span>
    <b-button
      @click="showModal"
      variant="unstyled"
      style="
        color: rgba(255, 255, 255, 0.77255);
        padding: 0;
        padding-bottom: 0.2em;
        font-weight: bold;
      "
    >
      Videos
      <i class="fa fa-caret-down"></i>
    </b-button>
    <b-modal
      ref="show-filter-modal"
      centered
      hide-footer
      title="Search in ..."
      body-class="show-filter-modal"
    >
      <b-form-checkbox v-model="allVideosChecked">All Videos</b-form-checkbox>
      <template v-if="!allVideosChecked">
        <hr />
        <b-form-checkbox v-if="musicShow" v-model="musicChecked">
          Music
        </b-form-checkbox>
        <b-form-checkbox v-if="moviesShow" v-model="moviesChecked">
          Movies
        </b-form-checkbox>
        <b-form-checkbox v-if="newsShow" v-model="newsChecked">
          News
        </b-form-checkbox>
        <template v-if="tvShows">
          <hr />
          <b-form-checkbox v-model="allTVShowsChecked">
            All TV Shows
          </b-form-checkbox>
          <template v-if="!allTVShowsChecked">
            <b-form-checkbox-group
              id="tv-shows-checkbox-group"
              v-model="tvShowChecked"
            >
              <b-form-checkbox
                v-for="tvShow in tvShowsFiltered"
                :key="`tv-show-${tvShow.id}`"
                :value="tvShow.id"
                class="d-block"
              >
                {{ tvShow.title }}
              </b-form-checkbox>
            </b-form-checkbox-group>
          </template>
        </template>
        <template v-if="talks">
          <hr />
          <b-form-checkbox v-model="allTalksChecked">All Talks</b-form-checkbox>
          <template v-if="!allTalksChecked">
            <b-form-checkbox-group
              id="tv-shows-checkbox-group"
              v-model="talkChecked"
            >
              <b-form-checkbox
                v-for="talk in talksFiltered"
                :key="`tv-show-${talk.id}`"
                :value="talk.id"
                class="d-block"
              >
                {{ talk.title }}
              </b-form-checkbox>
            </b-form-checkbox-group>
          </template>
        </template>
      </template>
    </b-modal>
  </span>
</template>

<script>
import Helper from '@/lib/helper'

export default {
  data() {
    return {
      tvShows: undefined,
      talks: undefined,
      musicShow: undefined,
      moviesShow: undefined,
      newsShow: undefined,
      allVideosChecked: false,
      allTVShowsChecked: false,
      allTalksChecked: false,
      tvShowFilter: "all",
      talkFilter: "all",
      musicChecked: false,
      newsChecked: false,
      moviesChecked: false,
      tvShowChecked: [],
      talkChecked: [],
    };
  },
  computed: {
    $l1() {
      if (typeof this.$store.state.settings.l1 !== "undefined")
        return this.$store.state.settings.l1;
    },
    $l2() {
      if (typeof this.$store.state.settings.l2 !== "undefined")
        return this.$store.state.settings.l2;
    },
    $adminMode() {
      if (typeof this.$store.state.settings.adminMode !== "undefined")
        return this.$store.state.settings.adminMode;
    },
    tvShowsFiltered() {
      if (this.tvShows)
        return this.tvShows.filter(
          (s) => !["Movies", "Music"].includes(s.title)
        );
    },
    talksFiltered() {
      if (this.talks)
        return this.talks.filter((s) => !["News"].includes(s.title));
    },
  },
  mounted() {
    if (typeof this.$store.state.settings !== "undefined") {
      this.loadSettings();
    }
    this.unsubscribeSettings = this.$store.subscribe((mutation, state) => {
      if (mutation.type === "settings/LOAD_SETTINGS") {
        this.loadSettings();
      }
    });
    this.loadShows();
    this.unsubscribeShows = this.$store.subscribe((mutation, state) => {
      if (mutation.type.startsWith("shows")) {
        this.loadShows();
      }
    });
  },
  beforeDestroy() {
    this.unsubscribeSettings();
    this.unsubscribeShows();
  },
  watch: {
    allVideosChecked() {
      this.updateSettings();
    },
    allTVShowsChecked() {
      this.updateSettings();
    },
    allTalksChecked() {
      this.updateSettings();
    },
    newsChecked() {
      this.updateSettings();
    },
    moviesChecked() {
      this.updateSettings();
    },
    musicChecked() {
      this.updateSettings();
    },
    talkChecked() {
      this.updateSettings();
    },
    tvShowChecked() {
      this.updateSettings();
    },
  },
  methods: {
    loadSettings() {
      this.tvShowFilter = this.$store.state.settings.l2Settings.tvShowFilter;
      this.talkFilter = this.$store.state.settings.l2Settings.talkFilter;
      console.log('filters loaded: ', this.tvShowFilter, this.talkFilter)
      this.allVideosChecked =
        this.tvShowFilter === "all" && this.talkFilter === "all";
      if (!this.allVideosChecked) {
        this.allTVShowsChecked = this.tvShowFilter === "all";
        this.allTalksChecked = this.talkFilter === "all";
        if (!this.allTVShowsChecked) {
          this.checkSpecials()
          this.tvShowChecked = this.tvShowFilter
        }
        if (!this.allTalksChecked) {
          this.checkSpecials()
          this.talkChecked = this.talkFilter
        }
      }
    },
    checkSpecials() {
      if (this.musicShow) {
        let musicId = Number(this.musicShow.id)
        this.musicChecked = this.tvShowFilter.includes(musicId);
        this.tvShowChecked = this.tvShowChecked.filter(id => id !== musicId)
      }
      if (this.moviesShow) {
        let moviesId = Number(this.moviesShow.id)
        this.moviesChecked = this.tvShowFilter.includes(moviesId);
        this.tvShowChecked = this.tvShowChecked.filter(id => id !== moviesId)
      }
      if (this.newsShow) {
        let newsId = Number(this.moviesShow.id)
        this.newsChecked = this.talkFilter.includes(Number(this.newsShow.id));
        this.talkChecked = this.talkChecked.filter(id => id !== newsId)
      }
    },
    updateSettings() {
      let tvShowFilter = this.getTvShowFilter();
      let talkFilter = this.getTalkFilter();

      this.tvShowFilter = tvShowFilter;
      console.log("Updating settings: tvShowFilter", tvShowFilter);
      this.$store.commit("settings/SET_L2_SETTINGS", {
        tvShowFilter: this.tvShowFilter,
      });

      this.talkFilter = talkFilter;
      console.log("Updating settings: talkFilter", talkFilter);
      this.$store.commit("settings/SET_L2_SETTINGS", {
        talkFilter: this.talkFilter,
      });
    },
    getTvShowFilter() {
      if (this.allVideosChecked) return "all";
      if (this.allTVShowsChecked) {
        let all = true;
        if (this.musicShow && !this.musicChecked) all = false;
        if (this.moviesShow && !this.moviesChecked) all = false;
        if (all) return "all";
        else {
          return this.tvShows.map((s) => s.id);
        }
      }
      let tvShowFilter = [].concat(this.tvShowChecked);
      if (this.musicChecked) {
        if (this.musicShow) tvShowFilter.push(this.musicShow.id);
      }
      if (this.moviesChecked) {
        if (this.moviesShow) tvShowFilter.push(this.moviesShow.id);
      }
      return Helper.unique(tvShowFilter);
    },
    getTalkFilter() {
      if (this.allVideosChecked) return "all";
      if (this.allTalksChecked) {
        let all = true;
        if (this.newsShow && !this.newsChecked) all = false;
        if (all) return "all";
        else {
          return this.talks.map((s) => s.id);
        }
      }
      let talkFilter = [].concat(this.talkChecked);
      if (this.newsChecked) {
        if (this.newsShow) talkFilter.push(this.newsShow.id);
      }
      return Helper.unique(talkFilter);
    },
    showModal() {
      this.$refs["show-filter-modal"].show();
    },
    loadShows() {
      this.tvShows = this.$store.state.shows.tvShows[this.$l2.code]
        ? this.$store.state.shows.tvShows[this.$l2.code]
        : undefined;
      this.talks = this.$store.state.shows.talks[this.$l2.code]
        ? this.$store.state.shows.talks[this.$l2.code]
        : undefined;
      if (this.tvShows) {
        this.musicShow = this.tvShows.find((s) => s.title === "Music");
        this.moviesShow = this.tvShows.find((s) => s.title === "Movies");
      }
      if (this.talks) {
        this.newsShow = this.talks.find((s) => s.title === "News");
      }
      this.checkSpecials()
    },
  },
};
</script>

<style>
</style>