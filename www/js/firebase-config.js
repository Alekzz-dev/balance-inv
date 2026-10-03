import { initializeApp }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { initializeFirestore, persistentLocalCache }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCIjzCIH4UO2XVKenfdQ-bqfHQ2XnGOSnE",
  authDomain: "balance-inv.firebaseapp.com",
  projectId: "balance-inv",
  appId: "1:80422375058:web:347a3699b9e02810e2204b"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, { localCache: persistentLocalCache() });