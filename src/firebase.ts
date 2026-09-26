import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// 웹 앱용 공개 설정입니다. 데이터 접근 권한은 firestore.rules로 제한합니다.
const app = initializeApp({
  apiKey: 'AIzaSyBOAdBtSFMtEO3k7JWkDbcHy8brHmsCHrM',
  authDomain: 'vuepractice-c5f09.firebaseapp.com',
  projectId: 'vuepractice-c5f09',
  storageBucket: 'vuepractice-c5f09.firebasestorage.app',
  messagingSenderId: '354394397341',
  appId: '1:354394397341:web:8696305eba953ae8945274',
})
export const auth = getAuth(app)
export const db = getFirestore(app)
