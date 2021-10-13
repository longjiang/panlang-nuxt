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
      <hr />
      <b-form-checkbox v-model="musicChecked">Music</b-form-checkbox>
      <b-form-checkbox v-model="newsChecked">News</b-form-checkbox>
      <b-form-checkbox v-model="moviesChecked">Movies</b-form-checkbox>
      <hr />
      <b-form-checkbox v-model="allTVShowsChecked">
        All TV Shows
      </b-form-checkbox>
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
      <b-form-checkbox v-model="allTalksChecked">All Talks</b-form-checkbox>
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
      tvShowFilter: false,
      talkFilter: false,
      allVideosChecked: true,
      musicChecked: true,
      newsChecked: true,
      moviesChecked: true,
      allTVShowsChecked: true,
      allTalksChecked: true,
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
      if (this.talks) return this.talks.filter((s) => !["News"].includes(s.title));
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
    this.tvShows = this.$store.state.shows.tvShows[this.$l2.code]
      ? this.$store.state.shows.tvShows[this.$l2.code]
      : undefined;
    this.talks = this.$store.state.shows.talks[this.$l2.code]
      ? this.$store.state.shows.talks[this.$l2.code]
      : undefined;
    this.unsubscribe = this.$store.subscribe((mutation, state) => {
      if (mutation.type.startsWith("shows")) {
        this.loadShows();
      }
    });
  },
  methods: {
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
    },
  },
};
</script>

<style>
</style>