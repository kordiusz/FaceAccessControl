import React, { MouseEventHandler, useEffect, useState } from 'react';
import logo from './logo.svg';
import '../App.css';
import {  collection, deleteDoc, doc, FirestoreDataConverter, getDoc, getDocs, limit, orderBy, query, QueryDocumentSnapshot, QuerySnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';
import {auth, db} from "../firebase-config"
import { signOut, signInWithPopup, GoogleAuthProvider, onAuthStateChanged , User} from 'firebase/auth';
import { UserData } from './LoginPage';
import {QRCodeSVG } from "qrcode.react";
import UserRecord from '../components/UserRecord';

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

    const onRemove = async (uid:string)=>{
        const token= await auth.currentUser?.getIdToken();
        await fetch("http://127.0.0.1:5000/users/delete/"+uid, {headers:{Authorization: "Bearer "+token}, method:"DELETE"});
        setUsers(prev=> prev?.filter(u=> u.uid !== uid));
    }

    useEffect(()=>{

        const fetchUserList = async ()=>{
            const q = query(collection(db, "users").withConverter(userDataConverter), orderBy("name"), limit(20));
            const snapshot = await getDocs(q);
            setUsers(snapshot.docs.map(record=>record.data()));
        }


        fetchUserList();
    },[])

    
    

    return (<ul className='divide-y divide-gray-200'>
        {users && users.map(x=>
            <UserRecord key={x.uid} user={x} onRemove={onRemove}/>
        )}
    </ul>)
}

export default BrowseUsersPage;
