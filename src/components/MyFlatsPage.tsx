import { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { updateDoc, collection, getDocs, query, where, doc, getDoc, deleteDoc } from "firebase/firestore";
import { auth } from "../config/firebase";
import CircularIndeterminate from "../components/Loading";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { useFavorites } from "../components/FavoritesContext";
import DeleteIcon from "@mui/icons-material/Delete"; // Import the delete icon
import EditIcon from "@mui/icons-material/Edit"; // Import the edit icon
import "../App.css";

const MyFlatsPage = () => {
    const [flats, setFlats] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
    const [isAdmin, setIsAdmin] = useState<boolean>(false); // Track if the user is an admin
    const { setFavoriteCount } = useFavorites(); // Use setFavoriteCount from context
    const navigate = useNavigate(); // Initialize navigate

    // Fetch flats created by the current user
    const fetchMyFlats = async (userEmail: string) => {
        try {
            const flatsCollection = collection(db, "flats");
            // Query flats where ownerEmail matches the current user's email
            const q = query(flatsCollection, where("ownerEmail", "==", userEmail));
            const flatsSnapshot = await getDocs(q);
            const flatsList = flatsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setFlats(flatsList);
        } catch (err) {
            setError("Error fetching your flats.");
            console.error("Error fetching flats:", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch user favorites and admin status
    const fetchUserData = async (userId: string) => {
        try {
            const userDocRef = doc(db, "users", userId);
            const userDocSnapshot = await getDoc(userDocRef);
            if (userDocSnapshot.exists()) {
                const userData = userDocSnapshot.data();

                // Fetch favorites
                if (userData.favorites) {
                    const favoritesObj: { [key: string]: boolean } = {};
                    userData.favorites.forEach((flatId: string) => {
                        favoritesObj[flatId] = true;
                    });
                    setFavorites(favoritesObj);
                    setFavoriteCount(userData.favorites.length); // Update favorite count
                }

                // Fetch admin status
                setIsAdmin(userData.isAdmin || false); // Set isAdmin state
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
        }
    };

    useEffect(() => {
        // Use onAuthStateChanged to wait for Firebase Authentication to initialize
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in
                await fetchMyFlats(user.email!); // Fetch flats for the logged-in user
                await fetchUserData(user.uid); // Fetch user favorites and admin status
            } else {
                // User is not signed in
                setError("You must be logged in to view your flats.");
                setFavorites({});
                setFavoriteCount(0); // Reset favorite count
                setLoading(false);
            }
        });

        // Clean up the listener on unmount
        return () => unsubscribe();
    }, []);

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

                setFavoriteCount(updatedFavorites.length); // Update favorite count
            }
        } catch (err) {
            console.error("Error updating favorites:", err);
        }
    };

    // Handle flat deletion
    const handleDeleteFlat = async (flatId: string) => {
        if (window.confirm("Are you sure you want to delete this flat?")) {
            try {
                const flatRef = doc(db, "flats", flatId);
                await deleteDoc(flatRef);
                setFlats(flats.filter((flat) => flat.id !== flatId)); // Update state after deletion
            } catch (err) {
                setError("Failed to delete flat");
                console.error("Error deleting flat:", err);
            }
        }
    };

    return (
        <div className="home-page">
            <h1 className="title">My Flats</h1>
            {loading ? (
                <div className="loading">
                    <CircularIndeterminate />
                </div>
            ) : error ? (
                <p>{error}</p>
            ) : flats.length === 0 ? (
                <p>You haven't created any flats yet.</p>
            ) : (
                <div className="flat-cards-container">
                    {flats.map((flat) => {
                        const isOwner = auth.currentUser?.email === flat.ownerEmail; // Check if current user is the owner
                        const canEdit = isOwner || isAdmin; // Allow editing if user is owner or admin

                        return (
                            <div key={flat.id} className="flat-card">
                                {/* Action buttons (Edit and Delete) */}
                                <div className="action-buttons">
                                    {canEdit && (
                                        <button
                                            className="action-button"
                                            onClick={() => navigate(`/edit-flat/${flat.id}`)} // Navigate to edit page
                                        >
                                            <EditIcon fontSize="small" /> {/* Pencil icon */}
                                        </button>
                                    )}
                                    {canEdit && (
                                        <button
                                            className="action-button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDeleteFlat(flat.id); // Delete the flat
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" /> {/* Delete icon */}
                                        </button>
                                    )}
                                </div>
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

export default MyFlatsPage;