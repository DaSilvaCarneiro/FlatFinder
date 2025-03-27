import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";
import { auth } from "../config/firebase";
import { FirebaseError } from "firebase/app";
import { useNavigate } from "react-router-dom";
import "../styles/AdminPanel.css"; // Keep this if you have other styles
import {
    Typography,
    Button,
    TextField,
    IconButton,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    CircularProgress,
    Snackbar,
    Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

// No need for makeStyles since we're using CSS

const AdminPage: React.FC = () => {
    const [flats, setFlats] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editFlatModalOpen, setEditFlatModalOpen] = useState<boolean>(false);
    const [flatToEdit, setFlatToEdit] = useState<any>(null);
    const [deletePassword, setDeletePassword] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    const navigate = useNavigate();

    // Fetch flats and users data (same as before)
    const fetchData = async () => {
        try {
            const flatsCollection = collection(db, "flats");
            const flatsSnapshot = await getDocs(flatsCollection);
            const flatsList = flatsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setFlats(flatsList);

            const usersCollection = collection(db, "users");
            const usersSnapshot = await getDocs(usersCollection);
            const usersList = usersSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setUsers(usersList);
        } catch (err) {
            setError("Error fetching data");
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    // useEffect and other handlers remain the same
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const userRef = doc(db, "users", currentUser.uid);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData?.isAdmin) {
                            setIsAdmin(true);
                            fetchData();
                            console.log("isAdmin", isAdmin)
                        } else {
                            navigate("/");
                        }
                    } else {
                        navigate("/login");
                    }
                } catch (err) {
                    navigate("/login");
                }
            } else {
                navigate("/login");
            }
        });

        return () => unsubscribe();
    }, []);

    const handleDeleteFlat = async (flatId: string) => {
        try {
            const flatRef = doc(db, "flats", flatId);
            await deleteDoc(flatRef);
            setFlats(flats.filter((flat) => flat.id !== flatId));
        } catch (err) {
            setError("Failed to delete flat");
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete || !auth.currentUser || !auth.currentUser.email) return;

        setIsProcessing(true);

        try {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, deletePassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            await deleteDoc(doc(db, "users", userToDelete.id));

            if (auth.currentUser.uid === userToDelete.id) {
                await deleteUser(auth.currentUser);
                setNotification({ message: "Your account has been deleted successfully.", severity: 'success' });
                setTimeout(() => navigate("/"), 2000);
            } else {
                setNotification({ message: "User deleted successfully.", severity: 'success' });
                setUserToDelete(null);
                fetchData();
            }
        } catch (err) {
            let errorMessage = "Failed to delete account";
            if (err instanceof FirebaseError) {
                switch (err.code) {
                    case "auth/wrong-password":
                        errorMessage = "Incorrect password.";
                        break;
                    case "auth/requires-recent-login":
                        errorMessage = "Session expired. Please log in again.";
                        break;
                    default:
                        errorMessage = err.message;
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            setNotification({ message: errorMessage, severity: 'error' });
            setDeletePassword("");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { isAdmin: !isAdmin });
            setNotification({ message: `Admin permissions ${isAdmin ? "revoked" : "granted"} successfully.`, severity: 'success' });
            fetchData();
            navigate("/");
        } catch (err) {
            setNotification({ message: "Failed to update admin permissions.", severity: 'error' });
            console.error("Error updating admin permissions:", err);
        }
    };

    const handleEditFlat = (flatId: string) => {
        const flat = flats.find((flat) => flat.id === flatId);
        setFlatToEdit(flat);
        setEditFlatModalOpen(true);
    };

    const handleSaveFlat = async () => {
        if (flatToEdit) {
            try {
                const flatRef = doc(db, "flats", flatToEdit.id);
                await updateDoc(flatRef, flatToEdit);
                setFlats(flats.map((flat) => (flat.id === flatToEdit.id ? flatToEdit : flat)));
                setEditFlatModalOpen(false);
            } catch (err) {
                setError("Failed to save flat");
            }
        }
    };

    return (
        <div className="admin-container">
            <Typography variant="h4">Admin Panel</Typography>

            {loading ? (
                <div className="loading">
                    <CircularProgress />
                </div>
            ) : error ? (
                <div>{error}</div>
            ) : (
                <div className="admin-content">
                    <Card className="card">
                        <CardContent className="card-content">
                            <Typography variant="h6">Flats ({flats.length})</Typography>
                            {flats.length === 0 ? (
                                <p>No flats available</p>
                            ) : (
                                flats.map((flat) => (
                                    <div key={flat.id} className="flat-item">
                                        <Typography>{flat.title}</Typography>
                                        <Typography>{flat.price} €</Typography>
                                        <div className="flat-actions">
                                            <Button
                                                onClick={() => handleEditFlat(flat.id)}
                                                className="button secondary"
                                            >
                                                Edit
                                            </Button>
                                            <IconButton
                                                onClick={() => handleDeleteFlat(flat.id)}
                                                size="small"
                                                className="button delete"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card className="card">
                        <CardContent className="card-content">
                            <Typography variant="h6">Users</Typography>
                            {users.length === 0 ? (
                                <p>No users available</p>
                            ) : (
                                users.map((user) => (
                                    <div key={user.id} className="user-item">
                                        <Typography>
                                            {user.firstName} {user.lastName} - {user.email}
                                            {user.isAdmin ? " (Admin)" : ""}
                                        </Typography>
                                        <div className="user-actions">
                                            <Button
                                                onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                                                className="button secondary"
                                            >
                                                {user.isAdmin ? "Revoke Admin" : "Grant Admin"}
                                            </Button>
                                            <Button
                                                onClick={() => setUserToDelete(user)}
                                                className="button delete"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Edit Flat Modal */}
            {editFlatModalOpen && (
                <div className="edit-modal">
                    <TextField
                        label="Title"
                        value={flatToEdit?.title || ""}
                        onChange={(e) => setFlatToEdit({ ...flatToEdit, title: e.target.value })}
                        className="text-field"
                    />
                    <TextField
                        label="Price"
                        value={flatToEdit?.price || ""}
                        onChange={(e) => setFlatToEdit({ ...flatToEdit, price: e.target.value })}
                        className="text-field"
                    />
                    <Button onClick={handleSaveFlat} className="button primary">
                        Save
                    </Button>
                </div>
            )}

            {/* Delete User Modal */}
            <Dialog open={!!userToDelete} onClose={() => setUserToDelete(null)} className="dialog">
                <DialogTitle>Are you sure you want to delete this user?</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        This action cannot be undone. All data for this user will be permanently deleted.
                    </Typography>
                    <TextField
                        label="Enter Your Password"
                        type="password"
                        fullWidth
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        margin="normal"
                        disabled={isProcessing}
                        className="text-field"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUserToDelete(null)} className="button secondary" disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteUser}
                        className="button delete"
                        disabled={!deletePassword || isProcessing}
                    >
                        {isProcessing ? <CircularProgress size={24} /> : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={!!notification}
                autoHideDuration={6000}
                onClose={() => setNotification(null)}
            >
                <Alert
                    severity={notification?.severity}
                    onClose={() => setNotification(null)}
                    sx={{ width: '100%' }}
                >
                    {notification?.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default AdminPage;