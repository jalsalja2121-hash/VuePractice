<script setup lang="ts">
import { computed, ref } from 'vue'
defineProps<{ kind: string }>()
const label = ref('레디츠 실습 키트')
const quantity = ref(1)
const price = 12000
const total = computed(() => Math.max(1, Math.min(10, Number(quantity.value) || 1)) * price)
const payment = ref(0)
const order = ref<{ id: string; amount: number } | null>(null)
const fail = ref(false)
const paymentMessage = ref('')
function nextPayment() {
  if (payment.value === 0) { order.value = { id: `DEMO-${Date.now()}`, amount: total.value }; payment.value = 1; paymentMessage.value = '주문 정보가 메모리에 저장되었습니다.' }
  else if (payment.value === 1) { payment.value = 2; paymentMessage.value = '결제 인증 응답을 가정했습니다. 아직 승인 전입니다.' }
  else if (payment.value === 2) {
    if (fail.value) { paymentMessage.value = '승인 거절: 주문 금액과 요청 금액이 다릅니다. 오류 옵션을 해제하고 다시 시도하세요.'; return }
    payment.value = 3; paymentMessage.value = '모의 승인 완료. 실제 결제 또는 API 호출은 발생하지 않았습니다.'
  }
}
function resetPayment() { payment.value = 0; order.value = null; paymentMessage.value = ''; fail.value = false }
const signer = ref('홍길동')
const documentState = ref(0)
const consent = ref(false)
const signLog = ref<string[]>([])
function nextSign() {
  if (!signer.value.trim() || (documentState.value === 2 && !consent.value)) return
  const actions = ['서명 요청 생성 (알림 미발송)', '문서 열람', '서명 완료 이벤트 수신 가정']
  signLog.value.push(`${new Date().toLocaleTimeString('ko-KR')} · ${actions[documentState.value]}`)
  documentState.value++
}
function resetSign() { documentState.value = 0; consent.value = false; signLog.value = [] }
</script>
<template>
  <section v-if="kind === 'vue'" class="panel"><span class="badge">브라우저 실제 동작</span><h2>Vue 반응형 데이터</h2><p class="muted">입력한 값이 화면과 계산 결과에 즉시 반영됩니다. v-model과 computed를 직접 체험해 보세요.</p><div class="split"><div><label class="field">상품명<input v-model="label" maxlength="60"></label><label class="field">수량 {{ quantity }}개<input v-model.number="quantity" type="range" min="1" max="10"></label></div><div class="result"><h3>{{ label || '이름 없는 상품' }}</h3><p>단가 {{ price.toLocaleString() }}원 × {{ quantity }}개</p><strong>합계 {{ total.toLocaleString() }}원</strong></div></div><pre class="code">const quantity = ref(1)
const total = computed(() =&gt; quantity.value * 12000)
// 입력 변경 → 반응형 상태 변경 → 화면 자동 갱신</pre><p class="muted">Firebase의 실제 Google 로그인 · 실시간 CRUD는 <a href="#/practice">연습장</a>에서 실습할 수 있습니다.</p></section>
  <section v-else-if="kind === 'payment'" class="panel"><span class="badge sim">로컬 시뮬레이션 · 실제 결제 없음</span><h2>토스페이먼츠 결제 흐름</h2><p class="muted">주문 생성부터 인증, 금액 검증과 승인까지 순서대로 진행해 보세요. 토스 SDK를 호출하지 않는 학습용 모형입니다.</p><ol class="steps"><li v-for="(step, i) in ['주문 준비', '주문 생성', '인증 완료', '승인 완료']" :key="step" :class="{ active: i === payment }">{{ i + 1 }}. {{ step }}</li></ol><label class="field">주문 수량 {{ quantity }}개<input v-model.number="quantity" type="range" min="1" max="10" :disabled="payment > 0"></label><div class="result">결제 금액 <strong>{{ (order?.amount ?? total).toLocaleString() }}원</strong><br>주문번호: {{ order?.id ?? '주문 생성 후 표시' }}</div><label class="field"><input v-model="fail" type="checkbox" :disabled="payment === 3"> 금액 불일치 오류 체험</label><div class="controls"><button class="primary" :disabled="payment === 3" @click="nextPayment">{{ ['주문 만들기', '결제 인증 시뮬레이션', '금액 검증 및 모의 승인', '체험 완료'][payment] }}</button><button @click="resetPayment">초기화</button></div><p role="status">{{ paymentMessage }}</p><p class="muted">실제 연동 시: 브라우저는 클라이언트 키로 결제창을 열고, 서버가 저장된 주문 금액을 검증한 뒤 시크릿 키로 승인 API를 호출합니다. 시크릿 키는 프런트엔드에 넣지 않습니다.</p><a href="https://docs.tosspayments.com/guides/v2/payment-window/integration" target="_blank" rel="noopener noreferrer">공식 결제 연동 문서 ↗</a></section>
  <section v-else class="panel"><span class="badge sim">로컬 시뮬레이션 · 실제 서명 효력 없음</span><h2>모두싸인 전자서명 흐름</h2><p class="muted">서명 요청 → 열람 → 서명 완료 상태를 체험합니다. 이메일·문자 전송과 모두싸인 API 호출은 하지 않습니다.</p><ol class="steps"><li v-for="(step, i) in ['초안', '요청', '열람', '완료']" :key="step" :class="{ active: i === documentState }">{{ step }}</li></ol><label class="field">체험용 서명자 이름<input v-model="signer" maxlength="30" :disabled="documentState > 0"></label><div class="result"><strong>기술 실습 참여 확인서 (견본)</strong><p>{{ signer || '서명자' }} 님은 이 문서가 학습용 견본임을 확인합니다.</p><label v-if="documentState === 2"><input v-model="consent" type="checkbox"> 견본 문서를 확인했습니다.</label><p v-if="documentState === 3">{{ signer }} · 모의 서명 완료</p></div><div class="controls"><button class="primary" :disabled="documentState === 3 || !signer.trim() || (documentState === 2 && !consent)" @click="nextSign">{{ ['모의 서명 요청', '문서 열람하기', '모의 서명하기', '체험 완료'][documentState] }}</button><button @click="resetSign">초기화</button></div><div role="status"><p v-for="line in signLog" :key="line">{{ line }}</p></div><p class="muted">실제 연동에는 서버의 API 인증, 문서·참여자 설정, 웹훅 검증과 중복 이벤트 처리가 필요합니다.</p><a href="https://developers.modusign.co.kr/docs/quick-start" target="_blank" rel="noopener noreferrer">모두싸인 공식 QuickStart ↗</a></section>
</template>
