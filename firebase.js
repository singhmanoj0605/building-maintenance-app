const firebaseConfig = {
  apiKey:            "AIzaSyBCCXgHKY_SeccD0LtsQ6s6k9Tb0yKV7q0",
  authDomain:        "building-maintenance-8ec1a.firebaseapp.com",
  projectId:         "building-maintenance-8ec1a",
  storageBucket:     "building-maintenance-8ec1a.firebasestorage.app",
  messagingSenderId: "440918190706",
  appId:             "1:440918190706:web:e2e8d45ce9e80c7a24b0eb",
  measurementId:     "G-JP7R10LGV5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
