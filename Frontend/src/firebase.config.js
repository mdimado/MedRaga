


import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore'
import {getStorage} from 'firebase/storage'




const firebaseConfig = {
  apiKey: "AIzaSyD1bLQYh5Rti7xXzvw4fKWsst3zcxb8ZbI",
  authDomain: "medbot-19fec.firebaseapp.com",
  projectId: "medbot-19fec",
  storageBucket: "medbot-19fec.appspot.com",
  messagingSenderId: "818011802491",
  appId: "1:818011802491:web:3702cb5a87642586024bde"
};



const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app;
