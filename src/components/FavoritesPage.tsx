import { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth } from "../config/firebase";
import CircularIndeterminate from "./Loading";
import { Link } from "react-router-dom";
import { useFavorites } from '../components/FavoritesContext'; // Import useFavorites
import "../App.css";

const FavoritesPage = () => {
  const [favoriteFlats, setFavoriteFlats] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { setFavoriteCount } = useFavorites(); // Only use setFavoriteCount from context
  const [user, setUser] = useState(auth.currentUser); // Track the user state

  // Monitor Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user); // Set the user if logged in
        fetchFavoriteFlats(user.uid); // Fetch favorites for the logged-in user
      } else {
        setUser(null); // Reset user if not logged in
        setError("Please log in to view your favorites.");
        setLoading(false);
      }
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);

  // Fetch the user's favorite flats from Firestore
  const fetchFavoriteFlats = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        const favoriteFlatIds = userData.favorites || [];

        // Update the favorite count in the context
        setFavoriteCount(favoriteFlatIds.length);

        // Fetch the details of each favorite flat
        const favoriteFlatsList = await Promise.all(
          favoriteFlatIds.map(async (flatId: string) => {
            const flatDocRef = doc(db, "flats", flatId);
            const flatDocSnapshot = await getDoc(flatDocRef);
            if (flatDocSnapshot.exists()) {
              return { id: flatDocSnapshot.id, ...flatDocSnapshot.data() };
            } else {
              return null;
            }
          })
        );

        // Filter out any null values (flats that no longer exist)
        const validFavoriteFlats = favoriteFlatsList.filter((flat) => flat !== null);
        setFavoriteFlats(validFavoriteFlats);
      }
    } catch (err) {
      setError("Error fetching favorite flats");
      console.error("Error fetching favorite flats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to remove a flat from favorites
  const removeFromFavorites = async (flatId: string) => {
    if (!user) {
      alert("Please log in to manage favorites.");
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        let updatedFavorites = userData.favorites || [];

        // Remove the flat ID from the favorites array
        updatedFavorites = updatedFavorites.filter((id: string) => id !== flatId);

        // Update the Firestore document for the user
        await updateDoc(userDocRef, {
          favorites: updatedFavorites,
        });

        // Update the favorite count in the context
        setFavoriteCount(updatedFavorites.length);

        // Refresh the list of favorite flats
        fetchFavoriteFlats(user.uid);
      }
    } catch (err) {
      console.error("Error removing from favorites:", err);
    }
  };

  if (!user) {
    return <p>Please log in to view your favorites.</p>;
  }

  return (
    <div className="favorites-page">
      <h1 className="title">Your Favorite Flats</h1>
      {loading ? (
        <div className="loading">
          <CircularIndeterminate />
        </div>
      ) : error ? (
        <p>{error}</p>
      ) : favoriteFlats.length === 0 ? (
        <p>You have no favorite flats yet.</p>
      ) : (
        <div className="flat-cards-container">
          {favoriteFlats.map((flat) => (
            <div key={flat.id} className="flat-card">
              <Link to={`/flat/${flat.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <h2>{flat.title}</h2>
                <p>
                  <strong>City:</strong> {flat.city}{" "}
                  <img
                    className="city-icon"
                    src="https://www.freeiconspng.com/uploads/pin-png-25.png"
                    alt="city pin"
                  />
                </p>
                <p>
                  <strong>Owner:</strong> {flat.ownerName} ({flat.ownerEmail})
                </p>
              </Link>
              <button
                className="remove-favorite-button"
                onClick={() => removeFromFavorites(flat.id)}
              >
                ❌ Remove from Favorites
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;