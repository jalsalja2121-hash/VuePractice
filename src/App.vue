<script setup lang="ts">
import { computed, defineAsyncComponent, onUnmounted, ref } from "vue";
import HomeView from "./views/HomeView.vue";
import "./style.css";
const PracticeView = defineAsyncComponent(
  () => import("./views/PracticeView.vue"),
);
const LabView = defineAsyncComponent(() => import("./views/LabView.vue"));
const hash = ref(window.location.hash);
const sync = () => {
  hash.value = window.location.hash;
  window.scrollTo(0, 0);
};
window.addEventListener("hashchange", sync);
onUnmounted(() => window.removeEventListener("hashchange", sync));
const page = computed(() => hash.value.replace(/^#/, "") || "/");
</script>
<template>
  <div class="app-nav">
    <a href="#/" class="app-logo">L<span>•</span> LEARNING</a>
    <nav aria-label="주 메뉴">
      <a href="#/" :aria-current="page === '/' ? 'page' : undefined">홈</a
      ><a
        href="#/practice"
        :aria-current="page === '/practice' ? 'page' : undefined"
        >연습장</a
      ><a href="#/lab" :aria-current="page === '/lab' ? 'page' : undefined"
        >실습</a
      >
    </nav>
  </div>
  <HomeView v-if="page === '/'" />
  <PracticeView v-else-if="page === '/practice'" />
  <LabView v-else-if="page === '/lab'" />
  <main v-else class="page">
    <h1>페이지를 찾을 수 없습니다.</h1>
    <a href="#/">첫 화면으로 돌아가기</a>
  </main>
</template>
