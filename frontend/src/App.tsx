import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { collection, doc, FirestoreDataConverter, getDoc, getDocs, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';
import {auth, db} from "./firebase-config"



const logConverter: FirestoreDataConverter<Log> = {
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

interface Log{
  id:string,
  uid: string,
  time: Date,
  success: boolean
}

function App() {

  const [logs, setLogs] = useState<Log[]>();

  useEffect(()=>{

    const fetchLogs = async ()=>{
              const ref = collection(db,"logs").withConverter(logConverter);
              const snap = await getDocs(ref);
              setLogs(snap.docs.map(x=> x.data()));
            
    }

    fetchLogs();

  },[]);

  useEffect(()=>{
    console.log(logs)
  },[logs])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
          
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

export default App;
