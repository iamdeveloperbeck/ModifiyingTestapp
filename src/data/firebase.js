import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDumNqpiEN332xCG3JNi90OEQs22aNwyg",
    authDomain: "test-app-6d23d.firebaseapp.com",
    projectId: "test-app-6d23d",
    storageBucket: "test-app-6d23d.appspot.com",
    messagingSenderId: "77849006744",
    appId: "1:77849006744:web:3f9696c2055c5ad7c7b0dd",
    measurementId: "G-B5R32ZW3FD"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };