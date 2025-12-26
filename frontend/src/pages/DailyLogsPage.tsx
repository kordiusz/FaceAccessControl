import React, { MouseEventHandler, useEffect, useState } from 'react';
import logo from './logo.svg';
import '../App.css';
import { collection, doc, FirestoreDataConverter, getDoc, getDocs, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';
import {auth, db} from "../firebase-config"
import { signOut, signInWithPopup, GoogleAuthProvider, onAuthStateChanged , User} from 'firebase/auth';
import { Log, logConverter } from './BrowseLogsPage';
import cld from '../Cloudinary';
import { AdvancedImage } from '@cloudinary/react';
import { CloudinaryImage } from '@cloudinary/url-gen';

const DailyLogsPage = ()=>{
    const [logs, setLogs] = useState<Log[]>();
      const [user, setUser] = useState<User | null>();
      const [img, setImg] = useState<string>("");
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
        const fetchImg = async ()=>{
          fetch("http://localhost:5000/users/88spMo6SHOTS8UbOyyHnC5OQzhm1/model").then(res=> res.json()).then(res=> setImg(res["url"]));
        };
        fetchLogs();
        fetchImg();
    
      },[]);
      
      
      
      return (
    
     
    
        <div className="App">
          <header className="App-header">
            {auth.currentUser != null  && auth.currentUser.email}

            <img src={img}/>
            
            <button onClick={googleLoginHandler}>Google login</button>
            {auth.currentUser != null && <button onClick={logoutHandler}>logout</button>}
    
            {logs?.map((log,i)=>
    
              <div>
                <span>User:{log.uid} </span>
                <span>Match: {log.success?"yes":"no"}</span>,
                <span>Time: {log.time.toLocaleString("en-US")}</span>
            </div>
            )}
          </header>
        </div>
      );
    }
    

export default DailyLogsPage;