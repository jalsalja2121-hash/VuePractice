# 레디츠 학습 공간 — 연습장과 기술스택 실습실

Vue + Firebase 학습 메모에 홈과 기술스택 실습실을 추가한 프로젝트입니다.

## 화면 구성

- `#/`: 연습장 / 실습 두 가지 진입 버튼
- `#/practice`: 기존 Google 로그인과 Firebase 학습 메모 CRUD
- `#/lab`: 로그인 없이 사용하는 기술스택 실습실

해시 경로이므로 새로고침과 브라우저 뒤로 가기를 지원합니다. Firebase 코드는 연습장 진입 시 지연 로딩합니다.

| 모듈 | 체험 내용 | 실행 범위 |
| --- | --- | --- |
| Vue · Firebase | 입력/수량 변경에 따른 반응형 계산, 연습장 이동 | Vue 실제 실행, Firebase는 기존 연습장 |
| 토스페이먼츠 | 주문 생성, 인증, 금액 불일치, 승인 | 로컬 시뮬레이션, SDK/API 미호출 |
| 모두싸인 | 문서 요청, 열람, 확인 후 서명 | 로컬 시뮬레이션, 알림 미발송 |
| AI 비전 | 화재/연기 예제 박스 임계값, 영상 처리 예산 | 합성 예제, YOLO/TensorRT/DeepStream 미실행 |
| ROS 2 · Nvblox | 복셀 크기, 가상 스캔, 셀 수 비교 | 2D 단면 모형, 실제 TSDF/지도 생성 아님 |

실습 상태는 메모리에만 보관하며 모듈 이동/새로고침 시 초기화됩니다. Jetson이 없어도 모든 모형을 조작할 수 있습니다. 실제 장비 연결 계획과 요구사항은 [docs/JETSON.md](docs/JETSON.md)를 참고하세요.

실제 결제와 전자서명은 별도의 백엔드와 서비스 설정이 필요합니다. 시크릿 키/API 인증 정보는 Vue 코드나 `VITE_` 환경변수에 넣지 않습니다.


## 준비
Node.js 22.18 이상(22.x) 또는 24.12 이상이 필요합니다.
Firebase 프로젝트: vuepractice-c5f09. 웹 앱 설정은 src/firebase.ts에 적용했습니다. Analytics는 사용하지 않습니다.

## Firebase 콘솔 설정
1. https://console.firebase.google.com/project/vuepractice-c5f09/overview 접속
2. Authentication → 시작하기 → 로그인 방법 → Google 사용 설정 → 프로젝트 지원 이메일 선택 → 저장
3. Firestore Database → 데이터베이스 만들기 → 기본 데이터베이스 `(default)` 생성. 프로덕션 모드를 선택하고 지역을 확인하여 선택하세요.
4. Firestore Database → 규칙에서 이 폴더의 `firestore.rules` 내용을 붙여넣고 게시하세요. 기존 다른 앱 규칙이 있다면 전체 교체하지 말고 `/users/{uid}/notes/{noteId}` 블록을 병합하세요. 겹치는 공개 허용 규칙이 없어야 합니다.

웹 앱 설정은 관리자 권한이 아니므로 콘솔 설정은 소유자가 진행해야 합니다. 서비스 계정 키는 필요하지 않습니다.

Authentication → 설정 → 승인된 도메인에서 `localhost`가 없으면 추가하세요. 배포 시 실제 호스트 도메인도 추가하세요. 팝업 로그인을 사용하므로 브라우저에서 팝업을 허용해야 합니다.

전달받은 OAuth 클라이언트 ID는 앱에 직접 삽입하지 않습니다. Firebase의 Google 제공업체 설정을 SDK가 사용합니다.

## 실행
저장소를 내려받은 폴더의 터미널에서 실행하세요.
```sh
npm ci
npm run dev
```
터미널의 Local 주소를 브라우저에서 엽니다.

검사 및 배포용 빌드:
```sh
npm run build
npm run preview
```

## 기능
- 제목/내용 등록: Firestore 문서 생성
- 목록: onSnapshot 실시간 구독
- 수정, 완료 표시 전환, 확인 후 삭제
- 연결 실패 메시지, 다시 연결, 저장 중 중복 클릭 방지

저장 경로: `users/{Firebase 사용자 UID}/notes/{메모 ID}`. 각 사용자는 자신의 데이터만 접근합니다.
Google 로그인/로그아웃 및 로그인 복원이 지원됩니다. 같은 Google 계정은 다른 기기에서도 같은 메모를 조회합니다. 로그아웃 또는 계정 변경 시 화면의 메모와 편집 내용을 비웁니다.
이전 익명 계정이 남아 있다면 Google 계정 연결로 UID와 메모를 유지합니다. 이미 다른 Firebase 사용자에게 연결된 Google 계정인 경우 자동 병합하지 않고 별도 버튼으로 기존 계정 로그인을 제공합니다. 이 경우 익명 메모는 자동 이동되지 않습니다.

## 파일
- src/App.vue: 홈/연습장/실습 해시 경로와 공통 메뉴
- src/views/HomeView.vue: 초기 선택 화면
- src/views/PracticeView.vue: 기존 화면과 Firestore CRUD
- src/views/LabView.vue: 기술스택 모듈 선택
- src/components/: 웹 서비스 · 비전 · 복셀 실습 화면
- src/lab/models.ts: 탐지 예제 및 학습용 계산식
- tests/lab-models.test.mjs: 계산식 경계값 검증
- src/firebase.ts: Firebase 초기화
- firestore.rules: 사용자별 권한 및 데이터 검증
- firebase.json: Firestore 규칙 경로 및 Hosting 설정

## Firebase Hosting 배포 (선택)
```sh
npx firebase-tools login
npm run build
npx firebase-tools deploy --only hosting --project vuepractice-c5f09
```
배포와 원격 규칙 변경은 자동 실행하지 않았습니다.

## 검증

```sh
npm test
npm run build
```

브라우저 확인: 홈에서 두 페이지 이동, 실습 모듈 전환, 결제 금액 불일치/정상 승인, 서명 동의 확인, 탐지 임계값, 복셀 크기 변경, 모바일 화면, 새로고침을 확인합니다.

## 검증 범위
계산식 테스트 3개, happy-dom 기반 Vue 화면 동작 테스트 8개, TypeScript 검사와 프로덕션 빌드를 통과했습니다. 브라우저 실행 파일 다운로드가 실패하여 실제 브라우저의 시각적 레이아웃/모바일 렌더링 검사는 완료하지 못했습니다. 실제 Firebase 콘솔 설정 여부와 원격 CRUD는 아직 검증하지 않았습니다. 설정 후 메모 등록 → 새로고침 → 수정 → 완료 표시 → 삭제 순으로 확인하세요.
