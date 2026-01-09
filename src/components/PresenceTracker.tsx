
import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";

const PresenceTracker = () => {
    useEffect(() => {
        // Generate a session ID for this tab/window
        const sessionId = Math.random().toString(36).substring(2, 15);
        const sessionRef = doc(db, "active_sessions", sessionId);

        // Initial write
        setDoc(sessionRef, {
            lastSeen: serverTimestamp(),
            userAgent: navigator.userAgent
        });

        // Heartbeat every 30 seconds
        const interval = setInterval(() => {
            setDoc(sessionRef, {
                lastSeen: serverTimestamp(),
                userAgent: navigator.userAgent
            }, { merge: true });
        }, 30000);

        // Cleanup on unmount or close
        const cleanup = () => {
            clearInterval(interval);
            deleteDoc(sessionRef).catch(console.error);
        };

        window.addEventListener("beforeunload", cleanup);

        return () => {
            window.removeEventListener("beforeunload", cleanup);
            cleanup();
        };
    }, []);

    return null; // This component doesn't render anything
};

export default PresenceTracker;
