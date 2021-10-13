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
      <b-form-checkbox v-model="musicChecked">Music</b-form-checkbox>
      <b-form-checkbox v-model="newsChecked">News</b-form-checkbox>
      <b-form-checkbox v-model="moviesChecked">Movies</b-form-checkbox>
      <hr />
      <div><b>TV Shows:</b></div>
      <template v-if="tvShows">
        <b-form-checkbox
          v-for="(tvShow, index) in tvShowsFiltered"
          :key="`tv-show-${tvShow.id}`"
          v-model="tvShowChecked[index]"
        >
          {{ tvShow.title }}
        </b-form-checkbox>
      </template>
      <hr />
      <div><b>Talks:</b></div>
      <template v-if="talks">
        <b-form-checkbox
          v-for="(talk, index) in talksFiltered"
          :key="`talk-${talk.id}`"
          v-model="talkChecked[index]"
        >
          {{ talk.title }}
        </b-form-checkbox>
      </template>
    </b-modal>
  </span>
</template>

<script>
export default {
  data() {
    return {
      tvShows: undefined,
      talks: undefined,
      musicShow: undefined,
      moviesShow: undefined,
      newsShow: undefined,
      tvShowFilter: "all",
      talkFilter: "all",
      musicChecked: true,
      newsChecked: true,
      moviesChecked: true,
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
      this.tvShowFilter = this.$store.state.settings.l2Settings.tvShowFilter;
      this.talkFilter = this.$store.state.settings.l2Settings.talkFilter;
    }
    this.unsubscribe = this.$store.subscribe((mutation, state) => {
      if (mutation.type === "settings/LOAD_SETTINGS") {
        this.tvShowFilter = this.$store.state.settings.l2Settings.tvShowFilter;
        this.talkFilter = this.$store.state.settings.l2Settings.talkFilter;
      }
    });
    this.loadShows();
    this.unsubscribe = this.$store.subscribe((mutation, state) => {
      if (mutation.type.startsWith("shows")) {
        this.loadShows();
      }
    });
  },
  watch: {
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
    updateSettings() {
      let tvShowFilter = JSON.stringify(this.getTvShowFilter());
      let talkFilter = JSON.stringify(this.getTalkFilter());
      if (this.tvShowFilter !== tvShowFilter) {
        this.tvShowFilter = tvShowFilter;
        console.log("tvShowFilter", tvShowFilter);
      }
      if (this.talkFilter !== talkFilter) {
        this.talkFilter = talkFilter;
        console.log("talkFilter", talkFilter);
      }
    },
    getTvShowFilter() {
      let tvShowFilter = [];
      if (this.musicChecked) {
        if (this.musicShow) tvShowFilter.push(this.musicShow.id);
      }
      if (this.moviesChecked) {
        if (this.moviesShow) tvShowFilter.push(this.moviesShow.id);
      }
      return tvShowFilter;
    },
    getTalkFilter() {
        let talkFilter = [];
        if (this.newsChecked) {
          if (this.newsShow) talkFilter.push(this.newsShow.id);
        }
        return talkFilter;
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
      if (true) {
        let tvShowChecked = [];
        for (let show of this.tvShowsFiltered) {
          tvShowChecked.push(true);
        }
        this.tvShowChecked = tvShowChecked;
      }
      if (true) {
        let talkChecked = [];
        for (let talk of this.talksFiltered) {
          talkChecked.push(true);
        }
        this.talkChecked = talkChecked;
      }
    },
  },
};
</script>

<style>
</style>