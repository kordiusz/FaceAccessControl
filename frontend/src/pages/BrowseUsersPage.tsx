import React, { MouseEventHandler, useEffect, useState } from 'react';
import logo from './logo.svg';
import '../App.css';
import {  collection, doc, FirestoreDataConverter, getDoc, getDocs, limit, orderBy, query, QueryDocumentSnapshot, QuerySnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';
import {auth, db} from "../firebase-config"
import { signOut, signInWithPopup, GoogleAuthProvider, onAuthStateChanged , User} from 'firebase/auth';
import { UserData } from './LoginPage';


const userDataConverter : FirestoreDataConverter<UserData> = {
    toFirestore(user){
        return {}
    },
    fromFirestore(snapshot, options) : UserData{
        const data = snapshot.data(options);
        return {name:data.name, email:data.email, uid : data.uid}
    },
}

function BrowseUsersPage() {
    
    const [users, setUsers] = useState<Array<UserData>>();


    useEffect(()=>{

        const fetchUserList = async ()=>{
            const q = query(collection(db, "users").withConverter(userDataConverter), orderBy("name"), limit(20));
            const snapshot = await getDocs(q);
            setUsers(snapshot.docs.map(record=>record.data()));
        }


        fetchUserList();
    },[])


    return <div>
        {users && users.map(x=>
            <label>{x.name}</label>
        )}
    </div>
}

export default BrowseUsersPage;
