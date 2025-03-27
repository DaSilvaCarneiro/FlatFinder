import { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { collection, onSnapshot, doc, updateDoc, getDoc, deleteDoc } from "firebase/firestore";
import { auth } from "../config/firebase";
import CircularIndeterminate from "../components/Loading";
import { Link, useNavigate } from "react-router-dom";
import { useFavorites } from '../components/FavoritesContext';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import "../App.css";

const HomePage = () => {
  const [flats, setFlats] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { setFavoriteCount } = useFavorites();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<string>("");

  // Set up real-time Firestore listener for flats
  useEffect(() => {
    const unsubscribeFlats = onSnapshot(
      collection(db, "flats"),
      (snapshot) => {
        const flatsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFlats(flatsList);
        setLoading(false);
      },
      (err) => {
        setError("Error fetching flats in real-time");
        console.error("Firestore listener error:", err);
        setLoading(false);
      }
    );

    // Set up auth state listener
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        setFavorites({});
        setFavoriteCount(0);
      }
    });

    // Cleanup both listeners on unmount
    return () => {
      unsubscribeFlats();
      unsubscribeAuth();
    };
  }, []);

  // Fetch user data (favorites & admin status)
  const fetchUserData = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnapshot = await getDoc(userDocRef);
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();

        // Update favorites
        if (userData.favorites) {
          const favoritesObj: { [key: string]: boolean } = {};
          userData.favorites.forEach((flatId: string) => {
            favoritesObj[flatId] = true;
          });
          setFavorites(favoritesObj);
          setFavoriteCount(userData.favorites.length);
        }

        // Update admin status
        setIsAdmin(userData.isAdmin || false);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  // Sort flats based on criteria
  const sortFlats = (criteria: string) => {
    const sortedFlats = [...flats];
    switch (criteria) {
      case "priceAsc":
        sortedFlats.sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        sortedFlats.sort((a, b) => b.price - a.price);
        break;
      case "areaAsc":
        sortedFlats.sort((a, b) => a.area - b.area);
        break;
      case "areaDesc":
        sortedFlats.sort((a, b) => b.area - a.area);
        break;
      default:
        break;
    }
    setFlats(sortedFlats);
  };

  // Handle sorting dropdown change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const criteria = e.target.value;
    setSortBy(criteria);
    sortFlats(criteria);
  };

  // Toggle favorite status
  const toggleFavorite = async (id: string) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to add favorites.");
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        let updatedFavorites = userData.favorites || [];

        if (favorites[id]) {
          updatedFavorites = updatedFavorites.filter((flatId: string) => flatId !== id);
        } else {
          updatedFavorites.push(id);
        }

        await updateDoc(userDocRef, {
          favorites: updatedFavorites,
        });

        setFavorites((prevFavorites) => ({
          ...prevFavorites,
          [id]: !prevFavorites[id],
        }));

        setFavoriteCount(updatedFavorites.length);
      }
    } catch (err) {
      console.error("Error updating favorites:", err);
    }
  };

  // Delete a flat (admin only)
  const handleDeleteFlat = async (flatId: string) => {
    if (window.confirm("Are you sure you want to delete this flat?")) {
      try {
        const flatRef = doc(db, "flats", flatId);
        const flatSnapshot = await getDoc(flatRef);

        if (flatSnapshot.exists()) {
          // Remove from favorites if needed
          const user = auth.currentUser;
          if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnapshot = await getDoc(userDocRef);

            if (userDocSnapshot.exists()) {
              const userData = userDocSnapshot.data();
              let updatedFavorites = userData.favorites || [];
              updatedFavorites = updatedFavorites.filter((favoriteId: string) => favoriteId !== flatId);

              await updateDoc(userDocRef, {
                favorites: updatedFavorites,
              });

              setFavorites((prevFavorites) => {
                const newFavorites = { ...prevFavorites };
                delete newFavorites[flatId];
                return newFavorites;
              });

              setFavoriteCount(updatedFavorites.length);
            }
          }

          // Delete the flat
          await deleteDoc(flatRef);
          setFlats(flats.filter((flat) => flat.id !== flatId));
        }
      } catch (err) {
        setError("Failed to delete flat");
        console.error("Error deleting flat:", err);
      }
    }
  };

  return (
    <div className="home-page">
      <h1 className="title">All Flats</h1>
      <div className="sort-container">
        <label htmlFor="sort">Sort by:</label>
        <select id="sort" value={sortBy} onChange={handleSortChange}>
          <option value="">None</option>
          <option value="priceAsc">Price (Low to High)</option>
          <option value="priceDesc">Price (High to Low)</option>
          <option value="areaAsc">Area (Low to High)</option>
          <option value="areaDesc">Area (High to Low)</option>
        </select>
      </div>
      {loading ? (
        <div className="loading">
          <CircularIndeterminate />
        </div>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="flat-cards-container">
          {flats.map((flat) => {
            const isOwner = auth.currentUser?.email === flat.ownerEmail;
            const canEdit = isOwner || isAdmin;

            return (
              <div key={flat.id} className="flat-card">
                <div className="action-buttons">
                  {canEdit && (
                    <button
                      className="action-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/edit-flat/${flat.id}`);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      className="action-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteFlat(flat.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </button>
                  )}
                </div>
                <Link to={`/flat/${flat.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <h2>{flat.title}</h2>
                  <p><strong>City:</strong> {flat.city}</p>
                  <p><strong>Owner:</strong> {flat.ownerName} ({flat.ownerEmail})</p>
                  <p><strong>Price:</strong> {flat.price} €</p>
                  <p><strong>Area:</strong> {flat.area} m²</p>
                </Link>
                <button
                  className="favorite-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(flat.id);
                  }}
                >
                  {favorites[flat.id] ? "❤️ Added to Favorites" : "🤍 Add to Favorites"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HomePage;