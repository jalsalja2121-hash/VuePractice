<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { GoogleAuthProvider, linkWithPopup, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

type Note = { id: string; title: string; content: string; done: boolean }
const notes = ref<Note[]>([])
const title = ref('')
const content = ref('')
const editing = ref('')
const uid = ref('')
const ready = ref(false)
const busy = ref(false)
const error = ref('')
const message = ref('')
const connecting = ref(false)
const authLoading = ref(true)
const account = ref<User | null>(null)
const signedIn = computed(() => !!account.value && !account.value.isAnonymous)
const completed = computed(() => notes.value.filter(n => n.done).length)
let unsubscribe: (() => void) | undefined
let stopAuth: (() => void) | undefined
let generation = 0
function explain(e: unknown) {
  const code = (e as { code?: string }).code ?? 'unknown'
  if (code.includes('operation-not-allowed') || code.includes('configuration-not-found') || code.includes('admin-restricted')) return 'Firebase Authentication에서 Google 로그인을 켜주세요. (' + code + ')'
  if (code === 'auth/popup-closed-by-user') return '로그인이 취소되었습니다. 다시 로그인해주세요.'
  if (code === 'auth/popup-blocked') return '팝업을 허용한 뒤 Google 로그인을 다시 눌러주세요.'
  if (code === 'auth/unauthorized-domain') return 'Firebase Authentication 설정의 승인된 도메인에 현재 접속 도메인을 추가해주세요.'
  if (code === 'auth/credential-already-in-use') return '이미 연결된 Google 계정입니다. 기존 익명 메모는 자동 이동되지 않습니다. 기존 계정으로 로그인 버튼을 이용해주세요.'
  if (code.includes('permission-denied')) return 'Firestore 규칙을 확인해주세요. 프로젝트에 포함된 firestore.rules를 적용해야 합니다.'
  if (code.includes('unavailable') || code.includes('network')) return '인터넷 연결과 Firestore 데이터베이스 생성 여부를 확인해주세요. (' + code + ')'
  return '연결 또는 저장에 실패했습니다. Firebase 설정을 확인해주세요. (' + code + ')'
}
const existingAccount = ref(false)
function connect() {
  const current = ++generation
  unsubscribe?.(); unsubscribe = undefined
  ready.value = false; notes.value = []; uid.value = ''; error.value = ''
  const user = auth.currentUser
  if (!user || user.isAnonymous) return
  uid.value = user.uid
  unsubscribe = onSnapshot(query(collection(db, 'users', user.uid, 'notes'), orderBy('createdAt', 'desc')), { includeMetadataChanges: true }, snapshot => {
    if (current !== generation) return
    notes.value = snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as Note)
    ready.value = !snapshot.metadata.fromCache
    if (ready.value) error.value = ''
  }, e => { if (current === generation) { ready.value = false; error.value = explain(e) } })
}
async function login(useExisting = false) {
  if (connecting.value || authLoading.value) return
  connecting.value = true; error.value = ''; message.value = ''
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    if (auth.currentUser?.isAnonymous && !useExisting) {
      await linkWithPopup(auth.currentUser, provider)
      // Linking preserves the anonymous UID and its existing notes.
      account.value = auth.currentUser
      connect()
    } else await signInWithPopup(auth, provider)
    existingAccount.value = false
  } catch (e) {
    error.value = explain(e)
    existingAccount.value = (e as { code?: string }).code === 'auth/credential-already-in-use'
  } finally { connecting.value = false }
}
async function logout() {
  if (busy.value || connecting.value) return
  if ((title.value || content.value) && !window.confirm('작성 중인 내용을 지우고 로그아웃할까요?')) return
  connecting.value = true
  try { await signOut(auth) } catch (e) { error.value = explain(e) }
  finally { connecting.value = false }
}
function reset() { title.value = ''; content.value = ''; editing.value = '' }
async function perform(action: () => Promise<unknown>, success: string) {
  if (busy.value || !ready.value) return
  busy.value = true; error.value = ''; message.value = ''
  try { await action(); message.value = success } catch (e) { error.value = explain(e) }
  finally { busy.value = false }
}
async function save() {
  if (!title.value.trim()) return
  await perform(async () => {
    const data = { title: title.value.trim(), content: content.value.trim(), updatedAt: serverTimestamp() }
    if (editing.value) await updateDoc(doc(db, 'users', uid.value, 'notes', editing.value), data)
    else await addDoc(collection(db, 'users', uid.value, 'notes'), { ...data, done: false, createdAt: serverTimestamp() })
    reset()
  }, '메모를 저장했습니다.')
}
function edit(note: Note) { editing.value = note.id; title.value = note.title; content.value = note.content; document.getElementById('title')?.focus() }
async function remove(note: Note) {
  if (!window.confirm(`“${note.title}” 메모를 삭제할까요?`)) return
  await perform(async () => { await deleteDoc(doc(db, 'users', uid.value, 'notes', note.id)); if (editing.value === note.id) reset() }, '메모를 삭제했습니다.')
}
async function toggle(note: Note) {
  await perform(() => updateDoc(doc(db, 'users', uid.value, 'notes', note.id), { done: !note.done, updatedAt: serverTimestamp() }), note.done ? '학습 중으로 변경했습니다.' : '학습 완료로 표시했습니다.')
}
onMounted(() => {
  stopAuth = onAuthStateChanged(auth, user => {
    account.value = user; authLoading.value = false
    reset(); message.value = ''; existingAccount.value = false
    connect()
  }, e => { authLoading.value = false; error.value = explain(e) })
})
onUnmounted(() => { generation++; stopAuth?.(); unsubscribe?.() })
</script>

<template>
  <div class="shell">
    <header><a class="brand" href="/">L<span>•</span> LEARNING</a><div class="account"><template v-if="signedIn"><span class="account-name">{{ account?.displayName || account?.email }}</span><button :disabled="busy || connecting" @click="logout">로그아웃</button></template><span v-else class="connection">{{ authLoading ? '로그인 확인 중…' : '로그인 전' }}</span></div></header>
    <main>
      <div class="heading"><div><p class="eyebrow">LEDDITS / STUDY NOTES</p><h1>오늘 배운 것,<br><span>하나씩 쌓아가기.</span></h1><p class="intro">Vue부터 Firebase까지, 나만의 학습 기록</p></div><div class="counter"><strong>{{ completed }}<small> / {{ notes.length }}</small></strong><span>학습 완료</span></div></div>
      <div v-if="error" class="alert" role="alert">{{ error }} <button v-if="signedIn" :disabled="connecting" @click="connect">다시 연결</button></div>
      <p v-if="message" class="notice" role="status">{{ message }}</p>
      <section v-if="!signedIn" class="login-panel">
        <h2>Google 계정으로 학습 기록을 이어가세요</h2>
        <p>같은 계정으로 로그인하면 다른 기기에서도 내 메모를 볼 수 있습니다.</p>
        <button class="google-login" :disabled="connecting || authLoading" @click="login()">{{ connecting ? '로그인 중…' : 'Google 계정으로 로그인' }}</button>
        <button v-if="existingAccount" :disabled="connecting" @click="login(true)">기존 Google 계정으로 로그인</button>
      </section>
      <div v-else class="workspace">
        <section class="editor"><div class="section-heading"><h2>{{ editing ? '메모 수정' : '새 학습 메모' }}</h2><span>01 / WRITE</span></div>
          <form @submit.prevent="save"><label for="title">제목</label><input id="title" v-model="title" required maxlength="100" placeholder="오늘 무엇을 배웠나요?" :disabled="busy"><label for="content">학습 내용</label><textarea id="content" v-model="content" rows="8" maxlength="5000" placeholder="핵심 개념이나 다시 확인할 내용을 적어보세요." :disabled="busy"></textarea><div class="form-actions"><button class="primary" :disabled="!ready || busy || !title.trim()">{{ busy ? '처리 중…' : editing ? '수정 저장' : '메모 저장' }}</button><button v-if="editing" type="button" :disabled="busy" @click="reset">취소</button></div></form>
          <p class="hint">로그인한 Google 계정에 저장됩니다. 같은 계정으로 로그인하면 다른 기기에서도 이어서 볼 수 있습니다.</p>
        </section>
        <section class="list"><div class="section-heading"><h2>내 학습 기록 <span class="count">{{ notes.length }}</span></h2><span>02 / REVIEW</span></div>
          <div v-if="!ready && !notes.length" class="empty"><strong>{{ error ? '연결 설정을 확인해주세요' : '학습 기록을 불러오는 중입니다' }}</strong><p>{{ error ? '설정을 마친 뒤 다시 연결을 눌러주세요.' : '처음 연결할 때 잠시 시간이 걸릴 수 있습니다.' }}</p></div>
          <div v-else-if="!notes.length" class="empty"><span class="empty-icon">＋</span><strong>첫 번째 기록을 남겨보세요</strong><p>왼쪽에서 메모를 저장하면 여기에 나타납니다.</p></div>
          <article v-for="note in notes" :key="note.id" class="note" :class="{ done: note.done }"><div class="note-top"><span class="tag">{{ note.done ? '학습 완료' : '학습 중' }}</span><button class="complete" :disabled="busy || !ready" :aria-pressed="note.done" @click="toggle(note)">{{ note.done ? '✓ 완료' : '완료 표시' }}</button></div><h3>{{ note.title }}</h3><p class="note-content">{{ note.content || '작성한 내용이 없습니다.' }}</p><div class="note-actions"><button :disabled="busy || !ready" @click="edit(note)">수정</button><button class="delete" :disabled="busy || !ready" @click="remove(note)">삭제</button></div></article>
        </section>
      </div>
    </main><footer>나의 학습 노트 <span>Vue × Firebase</span></footer>
  </div>
</template>

<style>
.account{display:flex;align-items:center;gap:12px;min-width:0}.account-name{font-size:14px;overflow-wrap:anywhere}.login-panel{background:white;border:1px solid #dce5e9;border-radius:14px;padding:36px;text-align:center}.login-panel p{color:#60727c;line-height:1.8}.google-login{font-weight:600;padding:13px 22px;margin:12px}.account button{flex-shrink:0}@media(max-width:600px){header{height:auto!important;min-height:80px;flex-wrap:wrap;padding:15px 0;gap:14px}.login-panel{padding:24px}.account-name{max-width:160px}}
:root{font-family:Inter,'Noto Sans KR',system-ui,sans-serif;color:#192d39;background:#f4f7f9;font-synthesis:none}*{box-sizing:border-box}body{margin:0}button,input,textarea{font:inherit}button{cursor:pointer;border:1px solid #ccd7dc;border-radius:8px;background:white;color:#263f4b;padding:9px 14px;font-size:14px}button:hover:not(:disabled){background:#edf5f2}button:disabled{cursor:not-allowed;opacity:.5}button:focus-visible,a:focus-visible{outline:3px solid #279475;outline-offset:3px}.shell{max-width:1200px;padding:0 40px;margin:auto}header{height:90px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dce4e8}.brand{font-weight:800;letter-spacing:2px;text-decoration:none;color:#193b36}.brand span{color:#198361}.connection{font-size:14px;background:#e6eeec;padding:8px 12px;border-radius:30px;color:#37594e}.heading{display:flex;align-items:center;justify-content:space-between;margin:46px 0 38px}.eyebrow{font-size:12px;letter-spacing:2px;color:#507367;font-weight:700}h1{font-size:42px;line-height:1.35;letter-spacing:-1.5px;margin:14px 0}h1 span{color:#157756}.intro{color:#60727c;font-size:16px}.counter{padding:24px 36px;border-left:2px solid #cddfd8;display:flex;flex-direction:column;gap:8px}.counter strong{font-size:42px;color:#167556}.counter small{font-size:24px;color:#83928e}.counter>span{font-size:14px;color:#60727c}.workspace{display:grid;grid-template-columns:390px 1fr;gap:32px;align-items:start}.editor{background:white;padding:26px;border:1px solid #dce5e9;border-radius:14px}.section-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;gap:12px}h2{font-size:19px;margin:0}.section-heading>span{font-size:12px;color:#72878f;letter-spacing:1px}label{display:block;margin-bottom:9px;font-size:14px;font-weight:650}input,textarea{display:block;width:100%;border:1px solid #cbd7dd;border-radius:8px;padding:13px;background:#fbfcfd;color:#192d39;margin-bottom:23px;font-size:16px}textarea{resize:vertical;min-height:160px}input:focus,textarea:focus{outline:2px solid #238d6b;outline-offset:2px}.primary{background:#147553;color:white;border-color:#147553;flex:1;font-weight:700;padding:13px}.primary:hover:not(:disabled){background:#0c5a3f}.form-actions{display:flex;gap:10px}.hint{font-size:13px;color:#637780;line-height:1.8;margin:20px 0 0}.count{color:#197450;padding-left:6px}.list>.section-heading{padding:12px 0;margin-bottom:12px}.empty{min-height:275px;border:1px dashed #bdcdd2;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:24px}.empty strong{font-size:18px}.empty p{font-size:14px;color:#697c85;line-height:1.7}.empty-icon{font-size:32px;color:#258165;margin-bottom:18px}.note{background:white;border:1px solid #dae5e7;border-radius:12px;padding:23px;margin-bottom:16px}.note-top{display:flex;align-items:center;justify-content:space-between}.tag{font-size:12px;font-weight:600;background:#eaf1fc;color:#35608f;padding:5px 9px;border-radius:5px}.done .tag{background:#e3f3eb;color:#246b4e}.complete{border:0;font-size:13px}.note h3{font-size:19px;margin:16px 0 9px;overflow-wrap:anywhere}.note-content{white-space:pre-wrap;overflow-wrap:anywhere;font-size:16px;color:#536975;line-height:1.8;margin:0 0 18px}.note-actions{display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #edf1f3;padding-top:13px}.note-actions button{border:0;padding:5px 8px}.delete{color:#a74a49}.alert{background:#fff0e9;border:1px solid #ebc7b9;padding:16px;border-radius:8px;margin-bottom:20px;line-height:1.7}.alert button{margin-left:10px}.notice{background:#e2f2e9;padding:12px;border-radius:8px;color:#225c43}footer{display:flex;justify-content:space-between;font-size:12px;color:#788c94;border-top:1px solid #dce4e8;padding:24px 0;margin-top:55px}@media(max-width:850px){.workspace{grid-template-columns:1fr}.shell{padding:0 22px}.heading{margin:30px 0}h1{font-size:34px}.counter{padding:16px}.counter strong{font-size:30px}}@media(max-width:480px){header{height:76px;gap:10px}.brand{font-size:14px;letter-spacing:1px}.connection{font-size:12px}.counter{display:none}.editor{padding:20px}h1{font-size:30px}}
</style>
