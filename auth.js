import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

export function setupAuth(onLogin,onLogout){

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const registerBtn = document.getElementById("registerBtn");
  const loginBtn = document.getElementById("loginBtn");

  registerBtn.onclick = async ()=>{

    const email = emailInput.value;
    const password = passwordInput.value;

    await createUserWithEmailAndPassword(auth,email,password);

  };

  loginBtn.onclick = async ()=>{

    const email = emailInput.value;
    const password = passwordInput.value;

    await signInWithEmailAndPassword(auth,email,password);

  };

  onAuthStateChanged(auth,user=>{

    if(user){
      onLogin(user);
    }else{
      onLogout();
    }

  });

}
