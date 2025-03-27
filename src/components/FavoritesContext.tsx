import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface FavoritesContextType {
  favoriteCount: number;
  setFavoriteCount: (count: number) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [favoriteCount, setFavoriteCount] = useState<number>(0);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Fetch the user's favorites from Firestore
        const userRef = doc(db, "users", user.uid);
        const unsubscribeUser = onSnapshot(userRef, (userSnap) => {
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const favorites = userData.favorites || []; // Get the favorites array
            setFavoriteCount(favorites.length); // Update the favorite count
          }
        });

        // Cleanup the Firestore listener when the component unmounts
        return () => unsubscribeUser();
      } else {
        // If the user is not logged in, reset the favorite count
        setFavoriteCount(0);
      }
    });

    // Cleanup the auth listener when the component unmounts
    return () => unsubscribeAuth();
  }, []);

  return (
    <FavoritesContext.Provider value={{ favoriteCount, setFavoriteCount }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};