import { createApp } from "vue";
import App from "./App.vue";

import "./main.css";

import { createApolloClient } from "@nhost/apollo";
import { NhostClient } from "@nhost/vue";
import { DefaultApolloClient } from "@vue/apollo-composable";

import { createRouter, createWebHistory } from "vue-router";

const nhost = new NhostClient({
  subdomain: `${import.meta.env.VITE_SUBDOMAIN}`,
  region: "eu-west-2",
});

const apolloClient = createApolloClient({ nhost });

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("./components/Home.vue"),
      meta: {
        protected: true,
      },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("./components/Login.vue"),
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  if (to.matched.some((record) => record.meta.protected)) {
    const isAuthenticated = await nhost.auth.isAuthenticatedAsync();

    if (!isAuthenticated) {
      return next("/login");
    }
  }

  next();
});

createApp(App)
  .provide(DefaultApolloClient, apolloClient)
  .use(nhost)
  .use(router)
  .mount("#app");
