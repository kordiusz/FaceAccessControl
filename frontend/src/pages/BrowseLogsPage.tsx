import React, { MouseEventHandler, useEffect, useState } from 'react';
import logo from './logo.svg';
import '../App.css';
import { collection, doc, FirestoreDataConverter, getDoc, getDocs, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';
import {auth, db} from "../firebase-config"
import { signOut, signInWithPopup, GoogleAuthProvider, onAuthStateChanged , User} from 'firebase/auth';



export const logConverter: FirestoreDataConverter<Log> = {
  toFirestore(model: Log) {
    return {};
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Log {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      uid: data.uid,
      time: (data.time as Timestamp).toDate(),
      success: data.success,
    };
  }
};

export interface Log{
  id:string,
  uid: string,
  time: Date,
  success: boolean
}

function BrowseLogsPage() {

  const [logs, setLogs] = useState<Log[]>();
  const [user, setUser] = useState<User | null>();
  
  const googleLoginHandler :MouseEventHandler = async (event) => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
  
      const user = result.user;
      console.log("User:", user);
    
  
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };
  const logoutHandler:MouseEventHandler = async (event)=>{
    console.log(auth.currentUser)
    await signOut(auth);
  }

  onAuthStateChanged(auth, u=>{
    setUser(u);
  });

  useEffect(()=>{

    const fetchLogs = async ()=>{
              const ref = collection(db,"logs").withConverter(logConverter);
              const snap = await getDocs(ref);
              setLogs(snap.docs.map(x=> x.data()));
            
    }

    fetchLogs();

  },[]);


  return (

 

    <div className="App">
      <header className="App-header">
        {auth.currentUser != null  && auth.currentUser.email}

        
        <button onClick={googleLoginHandler}>Google login</button>
        {auth.currentUser != null && <button onClick={logoutHandler}>logout</button>}
        {logs?.map((log,i)=>

          <div>
            <span>Match: {log.success?"yes":"no"}</span>,
            <span>Time: {log.time.toLocaleString("en-US")}</span>
        </div>
        )}
      </header>
    </div>
  );
}

export default BrowseLogsPage;
