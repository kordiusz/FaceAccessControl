import React, { FormEvent, MouseEventHandler, useEffect, useState } from 'react';
import { collection, doc, FirestoreDataConverter, getDoc, getDocs, QueryDocumentSnapshot, setDoc, SnapshotOptions, Timestamp } from 'firebase/firestore';
import {auth, db} from "../firebase-config"
import { signOut, signInWithPopup, GoogleAuthProvider, onAuthStateChanged , User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const createUserDocument = async (user: User) => {
    const docRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(docRef);

    if(!userSnap.exists()){
      const model: UserData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
      };
      await setDoc(docRef, model);
    }
  };

  const googleLoginHandler: MouseEventHandler = async (event) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const user = result.user;
      
      await createUserDocument(user);
      navigate("/users");
  
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      setError("Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await createUserDocument(userCredential.user);
      navigate("/users");
    } catch (error: any) {
      console.error("Email/Password Error:", error);
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-8">
          {/* Google Login */}
          <button
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 py-2.5 rounded-md font-medium hover:bg-gray-50 transition"
            onClick={googleLoginHandler}
            disabled={isLoading}
          >
            <span> Continue with Google</span>
            <FcGoogle className="text-xl" />
           
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Email / Password Form */}
          <form className="space-y-4" onSubmit={handleEmailPasswordSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="inline-flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;