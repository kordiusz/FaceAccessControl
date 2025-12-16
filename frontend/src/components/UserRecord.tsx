import { useEffect, useState } from "react";
import { UserData } from "../pages/LoginPage";
import { QRCodeCanvas } from "qrcode.react";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "../firebase-config";
import { Log, logConverter } from "../pages/BrowseLogsPage";


interface UserProps{
    user:UserData
}

const UserRecord = ({user}: UserProps)=>{

    const [showQr, setShowQr] = useState<boolean>();
    const [entries, setEntries] = useState<Array<Log> | undefined>();
    const [links, setLinks] = useState<Record<string,string>>({});
    const [showEntries, setShowEntries] = useState<boolean>();
    const [intruderImage, setIntruderImage] = useState();
    const toggleQr = ()=>{
        setShowQr(!showQr);
    }

    const showEntriesHandler = ()=>{

        if (showEntries){
            setShowEntries(false)
            return
        }

        const fetchEntries = async()=>{

        const q = query(collection(db, "logs").withConverter(logConverter), where("uid", "==", user.uid), limit(20));
        const snapshot = await getDocs(q);
        setEntries(snapshot.docs.map(x=>x.data()));
        setShowEntries(true)
        }
        fetchEntries();
    }

    const getIntruderImgLink = (id:string)=>{
        return "http://127.0.0.1:5000/intruder/"+id
    }


    useEffect(()=>{

        const fetchLinks = async ()=>{
            if (!entries)
                return
            const token= await auth.currentUser?.getIdToken();
            const records:Record<string,string> = {};   
            await Promise.all(entries.map(async e=>{

                await fetch(getIntruderImgLink(e.image), {headers:{Authorization: "Bearer "+token}}).then(res=> res.blob()).then(blob=>{
                    const url = URL.createObjectURL(blob);
                    
                    records[e.id] = url;
                }).catch(err=>console.log(err));

            }));
            
            setLinks(records);
        }

        fetchLinks();
        
    },[entries])
    return (




        
        <li key={user.uid} className="odd:bg-gray-100 even:bg-white py-4 pl-3">


            <div className="flex flex-row items-baseline gap-4">

            <label>{user.name}</label>
            <label >{user.email}</label>
            
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" onClick={toggleQr}>{showQr? "Hide QR" : "Show QR"}</button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" onClick={showEntriesHandler}>{showEntries ? "Hide logs" : "Show logs"}</button>
            </div>
            <span className="text-center my-2">
            {showQr && <QRCodeCanvas value={user.uid}/>}
            </span>
            <ul className="flex flex-col ml-4">
            {showEntries && entries?.map(x=><li className="my-4">
                
                <label className="text-base font-semibold">{x.time.toLocaleString("en-US")} - {x.success ? <span className="text-green-700">pass</span> : <span className="text-red-700">not recognized</span>}</label>
                <img width="300" height="400" src={links[x.id]}/>
                
                </li>)}
                </ul>

        </li>
    )

}

export default UserRecord;