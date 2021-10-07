<router>
  {
    path: '/:l1/:l2/contact-us',
    meta: {
      title: 'Contact Us | PanLingo',
      metaTags: [
        {
          name: 'description',
          content: 'Get in touch with us.'
        }
      ]
    }
  }
</router>
<template>
  <div class="main">
    <div class="container pt-5 pb-5">
      <SocialHead :title="`Contact Us | PanLingo ${$l2.name}`" />
      <div class="row">
        <div class="col-12">
          <h3 class="mb-5 text-center">
            {{ $t("Contact PanLingo") }}
          </h3>
          <p>You can contact Jon (the dev) the following ways:</p>
          <ul>
            <li>Twitter: <a href="https://twitter.com/panlingo">@panlingo</a></li>
            <li>Email: <a href="mailto:jon@chinesezerotohero.com">jon@chinesezerotohero.com</a></li>
            <li>Telegram: @jon_zerotohero</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ContainerQuery } from "vue-container-query";

export default {
  components: {
    ContainerQuery,
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
  },
  data() {
    return {
      params: {},
      query: {
        lg: {
          minWidth: 960,
        },
      },
    };
  },
};
</script>

<style></style>
