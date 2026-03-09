import { auth } from "./firebase.js";

import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";


export function setupAuth(onLogin){

const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");


registerBtn.onclick = async ()=>{

const email = emailInput.value;
const pass = passwordInput.value;

await createUserWithEmailAndPassword(auth,email,pass);

};


loginBtn.onclick = async ()=>{

const email = emailInput.value;
const pass = passwordInput.value;

await signInWithEmailAndPassword(auth,email,pass);

};


onAuthStateChanged(auth,(user)=>{

if(user){

onLogin(user);

}

});

}
