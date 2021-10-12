<template>
  <div class="hide-defs-toggle">
    <b-form-checkbox v-model="hideDefinitions" class="d-inline">
      Hide defs
    </b-form-checkbox>
    <b-form-checkbox v-model="hidePhonetics" class="ml-2 d-inline">
      Hide phonetics
    </b-form-checkbox>
  </div>
</template>

<script>
export default {
  data() {
    return {
      hideDefinitions: false,
      hidePhonetics: false,
    };
  },
  watch: {
    hideDefinitions() {
      this.$store.commit("settings/SET_HIDE_DEFINITIONS", this.hideDefinitions);
      this.$emit("hideDefinitions", this.hideDefinitions);
    },
    hidePhonetics() {
      this.$store.commit("settings/SET_HIDE_PHONETICS", this.hidePhonetics);
      this.$emit("hidePhonetics", this.hidePhonetics);
    },
  },
  mounted() {
    if (typeof this.$store.state.settings !== "undefined") {
      this.hideDefinitions = this.$store.state.settings.hideDefinitions;
      this.hidePhonetics = this.$store.state.settings.hidePhonetics;
    }
    this.unsubscribe = this.$store.subscribe((mutation, state) => {
      if (mutation.type === "settings/LOAD_SETTINGS") {
        this.hideDefinitions = this.$store.state.settings.hideDefinitions;
        this.hidePhonetics = this.$store.state.settings.hidePhonetics;
      }
    });
  },
};
</script>

<style lang="scss" scoped>
.hide-defs-toggle {
  font-size: 0.8em;
  line-height: 2em;
}
</style>