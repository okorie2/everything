import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../backend/firebase";
import { getAuth } from "firebase/auth";
export const getBusinessCategories = async (viewMode = "approved") => {
  const auth = getAuth();
  try {
    const uid = auth.currentUser?.uid || "";

    const statusQuery = query(
      collection(db, "businesses"),
      where("status", "==", viewMode)
    );
    const statusSnap = await getDocs(statusQuery);

    const userQuery = uid
      ? query(
          collection(db, "businesses"),
          where("owner_id", "==", uid),
          where("status", "==", viewMode)
        )
      : null;

    const userSnap = userQuery ? await getDocs(userQuery) : null;

    const allBusinesses = [];

    statusSnap.docs.forEach((doc) => {
      if (doc.data().name !== "Bethel City Hospital") {
        allBusinesses.push(doc.data());
      }
    });

    if (userSnap) {
      userSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (
          data.name !== "Bethel City Hospital" &&
          !allBusinesses.some((b) => b.id === doc.id)
        ) {
          allBusinesses.push(data);
        }
      });
    }

    // Extract unique categories
    const categoriesSet = new Set(
      allBusinesses.map((biz) => biz.category).filter(Boolean)
    );

    return Array.from(categoriesSet);
  } catch (err) {
    console.error("CATEGORY QUERY ERROR →", err);
    return [];
  }
};
