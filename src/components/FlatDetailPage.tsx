import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../config/firebase";
import { updateDoc, getDoc, doc, onSnapshot, collection, addDoc, query, where, deleteDoc } from "firebase/firestore";
import CircularIndeterminate from "./Loading";
import { useFavorites } from '../components/FavoritesContext';
import "../styles/FlatDetailPage.css";

const FlatDetailPage = () => {
    const navigate = useNavigate();
    const { flatId } = useParams();
    const [flat, setFlat] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [images, setImages] = useState<string[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState<string>("");
    const [commentsLoading, setCommentsLoading] = useState<boolean>(true);
    const { setFavoriteCount } = useFavorites();

    // Real-time flat data listener
    useEffect(() => {
        if (!flatId) {
            setError("Flat ID is missing");
            setLoading(false);
            return;
        }

        const flatDoc = doc(db, "flats", flatId);
        const unsubscribeFlat = onSnapshot(flatDoc, (flatSnapshot) => {
            try {
                if (flatSnapshot.exists()) {
                    const flatData = flatSnapshot.data();
                    const dateAvailable = flatData?.dateAvailable?.toDate
                        ? flatData.dateAvailable.toDate()
                        : null;

                    setFlat({ id: flatSnapshot.id, ...flatData, dateAvailable });
                    setImages(flatData.images || []);
                    setError(null);
                } else {
                    setError("Flat not found");
                }
            } catch (err) {
                setError("Error fetching flat details");
                console.error("Error in flat listener:", err);
            } finally {
                setLoading(false);
            }
        }, (err) => {
            setError("Error listening to flat updates");
            console.error("Flat listener error:", err);
            setLoading(false);
        });

        return () => unsubscribeFlat();
    }, [flatId]);

    // Real-time comments listener
    useEffect(() => {
        if (!flatId) return;

        const commentsRef = collection(db, "comments");
        const q = query(commentsRef, where("flatId", "==", flatId));
        const unsubscribeComments = onSnapshot(q, (querySnapshot) => {
            try {
                const commentsData = querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
                    return {
                        id: doc.id,
                        ...data,
                        createdAt,
                    };
                });

                setComments(commentsData);
            } catch (err) {
                console.error("Error in comments listener:", err);
            } finally {
                setCommentsLoading(false);
            }
        }, (err) => {
            console.error("Comments listener error:", err);
            setCommentsLoading(false);
        });

        return () => unsubscribeComments();
    }, [flatId]);

    // User data and favorites listener
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user && flatId) {
                const userDocRef = doc(db, "users", user.uid);

                // Set up real-time listener for user data
                const unsubscribeUser = onSnapshot(userDocRef, (userDocSnapshot) => {
                    if (userDocSnapshot.exists()) {
                        const userData = userDocSnapshot.data();
                        setIsAdmin(userData?.isAdmin === true);

                        // Update favorites status
                        if (userData.favorites && userData.favorites.includes(flatId)) {
                            setIsFavorite(true);
                        } else {
                            setIsFavorite(false);
                        }
                    }
                }, (err) => {
                    console.error("User listener error:", err);
                });

                return () => unsubscribeUser();
            } else {
                setIsFavorite(false);
            }
        });

        return () => unsubscribeAuth();
    }, [flatId]);

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

                if (isFavorite) {
                    updatedFavorites = updatedFavorites.filter((flatId: string) => flatId !== id);
                } else {
                    updatedFavorites.push(id);
                }

                await updateDoc(userDocRef, {
                    favorites: updatedFavorites,
                });

                // Note: The state will update automatically via the onSnapshot listener
                setFavoriteCount(updatedFavorites.length);
            }
        } catch (err) {
            console.error("Error updating favorites:", err);
        }
    };

    const handlePostComment = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("Please log in to post a comment.");
            return;
        }

        if (!newComment.trim()) {
            alert("Comment cannot be empty.");
            return;
        }

        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnapshot = await getDoc(userDocRef);

            if (userDocSnapshot.exists()) {
                const userData = userDocSnapshot.data();
                const commentData = {
                    flatId,
                    userId: user.uid,
                    userName: `${userData.firstName} ${userData.lastName}`,
                    userEmail: user.email,
                    content: newComment,
                    createdAt: new Date(),
                };

                await addDoc(collection(db, "comments"), commentData);
                setNewComment("");
                // Note: Comments will update automatically via the onSnapshot listener
            }
        } catch (err) {
            console.error("Error posting comment:", err);
        }
    };

    const handleDeleteComment = async (commentId: string, commentUserEmail: string) => {
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to delete a comment.");
            return;
        }

        if (commentUserEmail !== user.email && !isAdmin && flat?.ownerEmail !== user.email) {
            alert("You do not have permission to delete this comment.");
            return;
        }

        try {
            await deleteDoc(doc(db, "comments", commentId));
            // Note: Comments will update automatically via the onSnapshot listener
        } catch (err) {
            console.error("Error deleting comment:", err);
        }
    };

    if (loading) return <div className="loading"><CircularIndeterminate /></div>;
    if (error) return <div>{error}</div>;
    if (!flat) return <div>Flat not found</div>;

    const isOwner = auth.currentUser?.email === flat.ownerEmail;

    return (
        <div className="flat-detail-container">
            <h1 className="flat-title">{flat.title}</h1>
            <div className="flat-rating">
                <span className="rating-star">★</span> 5.0 · 99 Reviews
            </div>

            <div className="flat-images-container">
                <div className="flat-images">
                    {images.map((imageUrl, index) => (
                        <img key={index} src={imageUrl} alt={`Flat Image ${index + 1}`} className="flat-image" />
                    ))}
                </div>
            </div>

            <div className="flat-info">
                <div className="flat-host">
                    <span className="host-label">Owned by </span>
                    <span className="host-name">{flat.ownerName}</span>
                </div>

                <div className="flat-details">
                    <p><strong>Price:</strong> {flat.price} €</p>
                    <p><strong>Area:</strong> {flat.area} m²</p>
                    <p><strong>City:</strong> {flat.city}</p>
                    <p><strong>Street:</strong> {flat.street}</p>
                    <p><strong>Flat Number:</strong> {flat.number}</p>
                    <p><strong>AC Available:</strong> {flat.ac ? "Yes" : "No"}</p>
                    <p><strong>Year Built:</strong> {flat.yearBuilt}</p>
                    <p><strong>Date Available:</strong> {flat.dateAvailable ? flat.dateAvailable.toLocaleDateString() : 'N/A'}</p>
                </div>

                <div className="flat-actions">
                    <button
                        className="favorite-button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(flat.id);
                        }}
                    >
                        {isFavorite ? "❤️ Added to Favorites" : "🤍 Add to Favorites"}
                    </button>

                    {(isOwner || isAdmin) && (
                        <button className="edit-button" onClick={() => navigate(`/edit-flat/${flatId}`)}>
                            Edit Flat
                        </button>
                    )}

                    <button className="back-button" onClick={() => navigate(-1)}>Back</button>
                </div>

                <div className="comment-section">
                    <h3>Comments</h3>
                    {commentsLoading ? (
                        <div className="loading"><CircularIndeterminate /></div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="comment">
                                <p><strong>{comment.userName}</strong> - {comment.createdAt?.toLocaleString()}</p>
                                <p>{comment.content}</p>
                                {(comment.userEmail === auth.currentUser?.email || isAdmin || isOwner) && (
                                    <button
                                        className="delete-comment-button"
                                        onClick={() => handleDeleteComment(comment.id, comment.userEmail)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        ))
                    )}

                    <div className="new-comment">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                        />
                        <button onClick={handlePostComment}>Post Comment</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlatDetailPage;