<script setup lang="ts">
import { ref } from "vue";
import WebLab from "../components/WebLab.vue";
import VisionLab from "../components/VisionLab.vue";
import MappingLab from "../components/MappingLab.vue";
const selected = ref("vue");
const modules = [
  {
    id: "vue",
    title: "Vue · Firebase",
    text: "반응형 화면과 학습 기록",
    category: "WEB",
  },
  {
    id: "payment",
    title: "토스페이먼츠",
    text: "주문에서 결제 승인까지",
    category: "SERVICE",
  },
  {
    id: "signature",
    title: "모두싸인",
    text: "문서 요청과 서명 상태",
    category: "SERVICE",
  },
  {
    id: "vision",
    title: "AI 비전 파이프라인",
    text: "YOLO · TensorRT · DeepStream",
    category: "EDGE AI",
  },
  {
    id: "mapping",
    title: "ROS 2 · Nvblox",
    text: "깊이 데이터와 복셀 지도",
    category: "ROBOTICS",
  },
];
</script>
<template>
  <main class="page">
    <p class="eyebrow">LEDDITS / TECH PLAYGROUND</p>
    <h1>개념을 넘어,<br /><span>직접 실험하는 기술.</span></h1>
    <p class="lead">
      모듈을 선택하고 값을 바꿔 보세요. 장비와 외부 서비스가 필요한 기능은
      학습용 시뮬레이션으로 제공합니다.
    </p>
    <div class="lab-layout">
      <nav class="module-nav" aria-label="실습 모듈">
        <button
          v-for="module in modules"
          :key="module.id"
          :aria-pressed="selected === module.id"
          @click="selected = module.id"
        >
          <small>{{ module.category }}</small
          ><strong>{{ module.title }}</strong
          ><span>{{ module.text }}</span>
        </button>
      </nav>
      <div class="lab-content">
        <WebLab
          v-if="['vue', 'payment', 'signature'].includes(selected)"
          :key="selected"
          :kind="selected"
        /><VisionLab v-else-if="selected === 'vision'" /><MappingLab v-else />
        <p class="lab-note">
          모듈을 이동하면 실습 상태가 초기화됩니다. 연습장의 Firebase 메모는
          계정에 저장됩니다.
        </p>
      </div>
    </div>
  </main>
</template>
<style scoped>
.lab-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 26px;
  margin-top: 34px;
}
.module-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.module-nav button {
  text-align: left;
  padding: 19px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: transparent;
}
.module-nav button[aria-pressed="true"] {
  background: #173e35;
  color: white;
  border-color: #173e35;
}
.module-nav small {
  font-size: 10px;
  letter-spacing: 1.5px;
  opacity: 0.7;
}
.module-nav strong {
  font-size: 16px;
}
.module-nav span {
  font-size: 12px;
  opacity: 0.8;
}
.lab-content {
  min-width: 0;
}
.lab-note {
  font-size: 12px;
  line-height: 1.8;
  color: #75877f;
  margin: 20px 4px;
}
@media (max-width: 800px) {
  .lab-layout {
    grid-template-columns: 1fr;
  }
  .module-nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .module-nav button {
    padding: 13px;
  }
  .module-nav strong {
    font-size: 14px;
  }
}
</style>
