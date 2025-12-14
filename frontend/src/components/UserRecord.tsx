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

        const fetchEntries = async()=>{

        const q = query(collection(db, "logs").withConverter(logConverter), where("uid", "==", user.uid), limit(20));
        const snapshot = await getDocs(q);
        setEntries(snapshot.docs.map(x=>x.data()));
        
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




        
        <li key={user.uid}>



            <label>{user.name}</label>
            {showQr && <QRCodeCanvas value={user.uid}/>}
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" onClick={toggleQr}>{showQr? "Hide QR" : "Show QR"}</button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" onClick={showEntriesHandler}>Entry log</button>
            {entries?.map(x=><div>
                <label>{x.time.toLocaleString("en-US")} - {x.success ? "ok" : "not recognized"}</label>
                {!x.success && <img width="300" height="400" src={links[x.id]}/>}
                
                </div>)}


        </li>
    )

}

export default UserRecord;