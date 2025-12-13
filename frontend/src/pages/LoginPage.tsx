import React, { MouseEventHandler, useEffect, useState } from 'react';

import { collection, doc, FirestoreDataConverter, getDoc, getDocs, QueryDocumentSnapshot, setDoc, SnapshotOptions, Timestamp } from 'firebase/firestore';
import {auth, db} from "../firebase-config"
import { signOut, signInWithPopup, GoogleAuthProvider, onAuthStateChanged , User} from 'firebase/auth';
import { redirect, useNavigate } from 'react-router-dom';

export interface UserData{
    uid:string,
    email:string | null,
    name:string | null
}

function LoginPage(){

const [user, setUser] = useState<User | null>();

const navigate = useNavigate();
  const googleLoginHandler :MouseEventHandler = async (event) => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
        
      const user = result.user;
      console.log("User:", user);

      const docRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(docRef);

      if(!userSnap.exists()){
        const model :UserData = {
            uid : user.uid,
            email : user.email,
            name : user.displayName
        };
        setDoc(docRef, model)
      }
      navigate("/logs");
  
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };



return <div>

        <label>Zaloguj sie:</label>
        <button onClick={googleLoginHandler}>Google login</button>
    </div>;
};

export default LoginPage;