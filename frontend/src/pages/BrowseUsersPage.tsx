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
        return {name:data.name, email:data.email, uid : data.uid, role: data.role}
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
            const q = query(collection(db, "users").withConverter(userDataConverter), orderBy("role"), limit(20));
            const snapshot = await getDocs(q);
            setUsers(snapshot.docs.map(record=>record.data()));
        }


        fetchUserList();
    },[])

    
    

  return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Page Title */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Manage users, view access logs, and generate QR codes
                    </p>
                </div>

                {/* Table */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    QR Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users && users.map(x=>
                                <UserRecord key={x.uid} user={x} onRemove={onRemove}/>
                            )}
                        </tbody>
                    </table>
                    
                    {users && users.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-sm">No users found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default BrowseUsersPage;
