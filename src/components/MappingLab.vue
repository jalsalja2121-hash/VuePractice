<script setup lang="ts">
import { computed, ref } from 'vue'
import { occupied, voxelEstimate } from '../lab/models'
const voxel = ref(.2)
const scan = ref(50)
const n = computed(() => Math.round(4 / voxel.value))
const cells = computed(() => Array.from({ length: n.value ** 2 }, (_, i) => {
  const x = i % n.value, y = Math.floor(i / n.value)
  return { x, y, seen: x < Math.ceil(n.value * scan.value / 100), obstacle: occupied(x, y, n.value) }
}))
const volumeCells = computed(() => voxelEstimate(voxel.value))
</script>
<template><section class="panel"><span class="badge sim">2D 단면 모형 · ROS / Nvblox 미실행</span><h2>공간을 복셀로 나누기</h2><p class="muted">4m × 4m 공간의 위에서 본 단면입니다. 복셀 크기를 줄이면 장애물 윤곽이 촘촘해지고 필요한 셀 수가 증가합니다. 실제 TSDF 계산이나 3D 재구성 결과는 아닙니다.</p><div class="split"><div><label class="field">복셀 한 변 {{ voxel.toFixed(2) }}m<select v-model.number="voxel"><option :value=".1">0.10m · 세밀하게</option><option :value=".2">0.20m · 기본</option><option :value=".4">0.40m · 거칠게</option></select></label><label class="field">가상 스캔 진행 {{ scan }}%<input v-model.number="scan" type="range" min="0" max="100" step="5"></label><div class="result">단면 셀 수 <strong>{{ n * n }}</strong><br>4m 정육면체를 모두 채우면 <strong>{{ volumeCells.toLocaleString() }}복셀</strong><br><small>실제 Nvblox는 필요한 영역을 할당하므로 이 숫자는 실제 메모리 사용량이 아닙니다.</small></div><div class="controls"><button @click="scan = Math.min(100, scan + 10)">10% 스캔</button><button @click="voxel = .2; scan = 0">초기화</button></div></div><div><svg viewBox="0 0 320 320" class="map" role="img" aria-label="복셀 크기와 스캔 진행률에 따른 장애물 지도"><rect v-for="cell in cells" :key="cell.y * n + cell.x" :x="cell.x * 320 / n" :y="cell.y * 320 / n" :width="320 / n" :height="320 / n" :fill="!cell.seen ? '#dce3e5' : cell.obstacle ? '#286955' : '#e7f3ea'" stroke="#fff" stroke-width=".7"/></svg><p class="legend">진한 초록: 장애물 · 연한 초록: 빈 공간 · 회색: 미관측</p></div></div><ol class="steps"><li>깊이 · RGB · 카메라 자세</li><li>ROS 2 토픽</li><li>Nvblox 지도 갱신</li><li>메시 · 내비게이션 지도</li></ol><p class="muted">실장비에서는 깊이 카메라와 카메라 자세 정보가 필요합니다. ROS 2는 데이터를 노드 사이에 전달하고, Nvblox는 깊이 정보를 통합하여 지도를 만듭니다. 이 화면은 복셀 크기의 영향만 설명합니다.</p><a href="https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_nvblox" target="_blank" rel="noopener noreferrer">Isaac ROS Nvblox 공식 저장소 ↗</a></section></template>
<style scoped>.map{width:100%;max-width:360px;border-radius:8px;display:block;margin:auto}.legend{font-size:12px;color:#60756b;line-height:1.7}</style>
