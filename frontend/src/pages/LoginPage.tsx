import React, { MouseEventHandler, useEffect, useState } from 'react';

import { collection, doc, FirestoreDataConverter, getDoc, getDocs, QueryDocumentSnapshot, setDoc, SnapshotOptions, Timestamp } from 'firebase/firestore';
import {auth, db} from "../firebase-config"
import { signOut, signInWithPopup, GoogleAuthProvider, onAuthStateChanged , User} from 'firebase/auth';
import { redirect, useNavigate } from 'react-router-dom';
import {FcGoogle} from 'react-icons/fc';
export interface UserData{
    uid:string,
    email:string | null,
    name:string | null,
    role?:string
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
            name : user.displayName,
         
        };
        setDoc(docRef, model)
      }
      navigate("/logs");
  
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };



 return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl shadow-lg p-8">
        
        {/* Title */}
        <h1 className="text-white text-2xl font-semibold text-center mb-6">
          Sign in
        </h1>

        {/* Google Login */}
        <button
          className="w-full flex items-center justify-center gap-3 bg-white text-black py-2.5 rounded-lg font-medium hover:bg-zinc-200 transition mb-4"
          onClick={googleLoginHandler}
        >
          
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-zinc-400 text-sm">or</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>

        {/* Email / Password */}
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-zinc-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full bg-zinc-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition"
          >
            Sign in
          </button>
        </form>

        {/* Footer */}
        <p className="text-zinc-400 text-sm text-center mt-6">
          Don’t have an account?{" "}
          <span className="text-indigo-500 hover:underline cursor-pointer">
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
};


export default LoginPage;