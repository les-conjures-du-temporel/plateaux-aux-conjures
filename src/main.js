import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBg8ecSB_ogiqWAWCZgWRcOKtkrRFu6fOE",
    authDomain: "plateaux-aux-conjures.firebaseapp.com",
    projectId: "plateaux-aux-conjures",
    storageBucket: "plateaux-aux-conjures.appspot.com",
    messagingSenderId: "656580485619",
    appId: "1:656580485619:web:edaa857b984e6e1bc57286"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);