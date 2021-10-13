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
      <b-form-checkbox>All Videos</b-form-checkbox>
      <hr />
      <b-form-checkbox>Music</b-form-checkbox>
      <b-form-checkbox>News</b-form-checkbox>
      <b-form-checkbox>Movies</b-form-checkbox>
      <hr />
      <b-form-checkbox>All TV Shows</b-form-checkbox>
      <template v-if="tvShows">
        <b-form-checkbox
          v-for="tvShow in tvShows.filter(
            (s) => !['Movies', 'Music'].includes(s.title)
          )"
          :key="`tv-show-${tvShow.id}`"
        >
          {{ tvShow.title }}
        </b-form-checkbox>
      </template>
      <hr />
      <b-form-checkbox>All Talks</b-form-checkbox>
      <template v-if="talks">
        <b-form-checkbox
          v-for="talk in talks.filter((s) => !['News'].includes(s.title))"
          :key="`talk-${talk.id}`"
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
  },
  mounted() {
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