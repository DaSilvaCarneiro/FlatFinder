import React, { useState, useEffect } from "react";
import "../styles/Profile.css"
import {
    Button,
    TextField,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Snackbar,
    Alert
} from "@mui/material";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged, updateEmail, reauthenticateWithCredential, EmailAuthProvider, deleteUser, User } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    birthdate: string;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("Profile Error:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return <Typography color="error">Something went wrong. Please try refreshing the page.</Typography>;
        }
        return this.props.children;
    }
}

const Profile: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData>({
        firstName: "",
        lastName: "",
        email: "",
        birthdate: "",
    });
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedUserData, setEditedUserData] = useState<UserData>({ ...userData });
    const [savePassword, setSavePassword] = useState("");
    const [deletePassword, setDeletePassword] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const navigate = useNavigate();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const birthdate = data.birthdate?.toDate().toISOString().split('T')[0] || "";

                    setUserData({
                        firstName: data.firstName || "",
                        lastName: data.lastName || "",
                        email: data.email || "",
                        birthdate,
                    });
                    setEditedUserData({
                        firstName: data.firstName || "",
                        lastName: data.lastName || "",
                        email: data.email || "",
                        birthdate,
                    });
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const validateForm = () => {
        if (!editedUserData.firstName.trim()) {
            setNotification({ message: "First name is required", severity: 'error' });
            return false;
        }
        if (!editedUserData.lastName.trim()) {
            setNotification({ message: "Last name is required", severity: 'error' });
            return false;
        }
        if (!emailRegex.test(editedUserData.email)) {
            setNotification({ message: "Please enter a valid email address", severity: 'error' });
            return false;
        }
        if (isNaN(new Date(editedUserData.birthdate).getTime())) {
            setNotification({ message: "Invalid birthdate format. Please use YYYY-MM-DD", severity: 'error' });
            return false;
        }
        return true;
    };

    const handleEditProfile = () => {
        setEditedUserData({ ...userData });
        setIsEditMode(true);
    };

    const handleSaveProfile = () => {
        if (!validateForm()) return;
        setIsReauthModalOpen(true);
    };

    const handleConfirmSave = async () => {
        if (!user || !user.email) {
            setNotification({ message: "User not authenticated", severity: 'error' });
            return;
        }

        setIsProcessing(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, savePassword);
            await reauthenticateWithCredential(user, credential);

            // Check if email is actually changed
            if (editedUserData.email !== user.email) {
                await updateEmail(user, editedUserData.email);
            }

            // Update Firestore data
            const birthdate = new Date(editedUserData.birthdate);
            await updateDoc(doc(db, "users", user.uid), {
                firstName: editedUserData.firstName,
                lastName: editedUserData.lastName,
                email: editedUserData.email, // Optional: Remove if using Auth email directly
                birthdate,
            });

            // Update local state
            setUserData({ ...editedUserData });
            setIsEditMode(false);
            setNotification({ message: "Profile updated successfully!", severity: 'success' });
        } catch (err) {
            console.error("Update error:", err); // Log the full error for debugging

            let message = "Failed to update profile";
            if (err instanceof Error) {
                // Use error code instead of message parsing
                switch ((err as any).code) {
                    case "auth/email-already-in-use":
                        message = "Email already in use";
                        break;
                    case "auth/invalid-email":
                        message = "Invalid email format";
                        break;
                    case "auth/wrong-password":
                        message = "Incorrect password";
                        break;
                    case "auth/requires-recent-login":
                        message = "Session expired. Please reauthenticate.";
                        break;
                    default:
                        message = err.message;
                }
            }
            setNotification({ message, severity: 'error' });
        } finally {
            setIsProcessing(false);
            setIsReauthModalOpen(false);
            setSavePassword("");
        }
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditedUserData({ ...userData });
    };

    const handleDeleteAccount = async () => {
        if (!user || !user.email) return;

        setIsProcessing(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, deletePassword);
            await reauthenticateWithCredential(user, credential);

            await deleteDoc(doc(db, "users", user.uid));
            await deleteUser(user);

            setNotification({ message: "Account deleted successfully", severity: 'success' });
            setTimeout(() => navigate("/"), 2000);
        } catch (err) {
            setNotification({
                message: err instanceof Error ? err.message : "Failed to delete account",
                severity: 'error'
            });
            setDeletePassword("");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ErrorBoundary>
            <div className="profile-container">
                <Typography variant="h4" gutterBottom className="profile-title">
                    Profile
                </Typography>

                <div className="profile-card">
                    {isEditMode ? (
                        <>
                            <TextField
                                label="First Name"
                                value={editedUserData.firstName}
                                onChange={(e) => setEditedUserData({ ...editedUserData, firstName: e.target.value })}
                                fullWidth
                                margin="normal"
                                inputProps={{ maxLength: 50 }}
                                className="profile-form"
                            />
                            <TextField
                                label="Last Name"
                                value={editedUserData.lastName}
                                onChange={(e) => setEditedUserData({ ...editedUserData, lastName: e.target.value })}
                                fullWidth
                                margin="normal"
                                inputProps={{ maxLength: 50 }}
                                className="profile-form"
                            />

                            <TextField
                                label="Birthdate"
                                type="date"
                                value={editedUserData.birthdate}
                                onChange={(e) => setEditedUserData({ ...editedUserData, birthdate: e.target.value })}
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    pattern: "\\d{4}-\\d{2}-\\d{2}",
                                    title: "Use YYYY-MM-DD format"
                                }}
                                className="profile-form"
                            />
                            <Box mt={2} display="flex" gap={2}>
                                <Button
                                    variant="contained"
                                    onClick={handleSaveProfile}
                                    disabled={isProcessing}
                                    className="profile-button"
                                >
                                    Save Changes
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleCancelEdit}
                                    disabled={isProcessing}
                                    className="profile-button"
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Typography variant="body1" className="profile-info"><strong>First Name:</strong> {userData.firstName}</Typography>
                            <Typography variant="body1" className="profile-info"><strong>Last Name:</strong> {userData.lastName}</Typography>
                            <Typography variant="body1" className="profile-info"><strong>Email:</strong> {userData.email}</Typography>
                            <Typography variant="body1" className="profile-info"><strong>Birthdate:</strong> {userData.birthdate}</Typography>
                            <Box mt={2} display="flex" gap={2}>
                                <Button
                                    variant="contained"
                                    onClick={handleEditProfile}
                                    disabled={isProcessing}
                                    className="profile-button"
                                >
                                    Edit Profile
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    disabled={isProcessing}
                                    className="profile-button profile-button-danger"
                                >
                                    Delete Account
                                </Button>
                            </Box>
                        </>
                    )}
                </div>
            </div>

            {/* Reauthentication Modal */}
            <Dialog
                open={isReauthModalOpen}
                onClose={() => setIsReauthModalOpen(false)}
                className="profile-dialog" // Add the class here
            >
                <DialogTitle>Reauthenticate to Save Changes</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        value={savePassword}
                        onChange={(e) => setSavePassword(e.target.value)}
                        margin="normal"
                        className="profile-form"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsReauthModalOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmSave} color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <DialogTitle>Delete Account</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">Are you sure you want to delete your account? This action is irreversible.</Typography>
                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        margin="normal"
                        className="profile-form"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleteModalOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteAccount} color="secondary">
                        Delete Account
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar Notification */}
            {notification && (
                <Snackbar open={true} autoHideDuration={6000} onClose={() => setNotification(null)}>
                    <Alert severity={notification.severity}>{notification.message}</Alert>
                </Snackbar>
            )}
        </ErrorBoundary>
    );
};

export default Profile;
