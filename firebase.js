import firebase from 'firebase/compat/app'
import 'firebase/compat/storage'

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey           : "AIzaSyBl8Jr02E2jp8ziJMJ--nqXIHhJpMHokF4",
	authDomain       : "ssf2024-s7-v2.firebaseapp.com",
	projectId        : "ssf2024-s7-v2",
	storageBucket    : "ssf2024-s7-v2.appspot.com",
	messagingSenderId: "182593757212",
	appId            : "1:182593757212:web:c879a31b86ae36eceb7fd9",
	measurementId    : "G-RTQRVK5025"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
	console.log("initializeApp(firebaseConfig)");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export {app, firebase, firebaseConfig}