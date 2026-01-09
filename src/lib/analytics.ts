import { db } from "./firebase";
import { doc, getDoc, setDoc, increment, updateDoc } from "firebase/firestore";

export const incrementTotalViews = async () => {
    try {
        const statsRef = doc(db, "stats", "general");
        const statsSnap = await getDoc(statsRef);

        if (statsSnap.exists()) {
            await updateDoc(statsRef, {
                views: increment(1)
            });
        } else {
            // Initialize if it doesn't exist
            await setDoc(statsRef, {
                views: 1
            });
        }
    } catch (error) {
        console.error("Error incrementing total views:", error);
    }
};

export const fetchGeneralStats = async () => {
    try {
        const statsRef = doc(db, "stats", "general");
        const statsSnap = await getDoc(statsRef);

        if (statsSnap.exists()) {
            return statsSnap.data();
        }
        return { views: 0 };
    } catch (error) {
        console.error("Error fetching general stats:", error);
        return { views: 0 };
    }
};
