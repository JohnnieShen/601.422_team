// src/firebase.js
import { initializeApp } from "firebase/app";
//import { getFirestore } from "firebase/firestore";
//import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';


// Config for testsupersurvey.firebaseapp.com
// const testFirebaseConfig = {
//   apiKey: "AIzaSyB__2yB4LzSSY9ZLJn379hAEfa2CLjZTXg",
//   authDomain: "testsupersurvey.firebaseapp.com",
//   projectId: "testsupersurvey",
//   storageBucket: "testsupersurvey.appspot.com",
//   messagingSenderId: "740469714815",
//   appId: "1:740469714815:web:7d25504f471713d2fd344a",
//   measurementId: "G-YWGV3NQF7M"
// };

// Config for supersurveyors.firebaseapp.com
const firebaseConfig = {
  apiKey: "AIzaSyArgB_tnOWxYUJmYWmDZJOZmfUw3u-qUI8",
  authDomain: "supersurveryors.firebaseapp.com",
  projectId: "supersurveryors",
  storageBucket: "supersurveryors.appspot.com",
  messagingSenderId: "95534794175",
  appId: "1:95534794175:web:93e6f03cb8dff33e594d0a",
  measurementId: "G-C4YGD03GF6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

//export { db, addDoc, collection};
export { db, collection, addDoc, getDocs, doc, getDoc };