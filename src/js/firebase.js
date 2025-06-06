import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDc2V4LI2jq57WXXhRyxPIy45lFu1k7WEw",
  authDomain: "twitter-clone-c59e1.firebaseapp.com",
  projectId: "twitter-clone-c59e1",
  storageBucket: "twitter-clone-c59e1.appspot.com", 
  messagingSenderId: "315000484494",
  appId: "1:315000484494:web:c2b37ce9dbef55892e8fdf",
  measurementId: "G-2FN9ZMBHML"
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app); 