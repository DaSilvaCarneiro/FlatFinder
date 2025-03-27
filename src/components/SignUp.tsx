import { useState } from "react";
import { TextField, Box, Button, CircularProgress } from "@mui/material";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import { doc, setDoc } from "firebase/firestore";

interface CredentialType {
    firstName: string;
    lastName: string;
    birthdate: string;  // Storing as string to handle date input
    email: string;
    password: string;
}

export default function Signup() {
    const [credential, setCredential] = useState<CredentialType>({
        firstName: '',
        lastName: '',
        birthdate: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);  // Loading state for async operations
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredential({ ...credential, [e.target.name]: e.target.value });
    };

    // Simple validation functions
    const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

    const isStrongPassword = (password: string) => password.length >= 6;

    const handleSignup = async () => {
        // Basic validations before signup
        if (!credential.firstName || !credential.lastName || !credential.email || !credential.password || !credential.birthdate) {
            setError("All fields are required.");
            setSuccess(null);
            return;
        }

        if (!isValidEmail(credential.email)) {
            setError("Please enter a valid email.");
            setSuccess(null);
            return;
        }

        if (!isStrongPassword(credential.password)) {
            setError("Password must be at least 6 characters.");
            setSuccess(null);
            return;
        }

        try {
            setLoading(true); // Start loading

            // Convert birthdate to Date object
            const birthdateObj = new Date(credential.birthdate);

            if (isNaN(birthdateObj.getTime())) {
                setError("Please enter a valid birthdate.");
                setSuccess(null);
                setLoading(false);
                return;
            }

            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, credential.email, credential.password);

            // Create user document in Firestore with additional fields
            await setDoc(doc(db, "users", userCredential.user.uid), {
                firstName: credential.firstName,
                lastName: credential.lastName,
                birthdate: birthdateObj,
                email: credential.email,
                isAdmin: false, // Add isAdmin field with default value false
                favorites: [], // Initialize favorites as an empty array
            });

            setSuccess("Signup successful! You are now logged in.");
            setError(null);
            navigate("/"); // Redirect to homepage after successful signup
        } catch (err) {
            setError("Failed to sign up. Check your details.");
            setSuccess(null);
        } finally {
            setLoading(false); // End loading
        }
    };

    return (
        <Box component="form" className="new-flat-container" noValidate autoComplete="off">
            <div className="new-flat-title">Sign Up</div>
            <div className="new-flat-form">
                <div className="form-group">
                    <TextField
                        id="firstName"
                        label="First Name"
                        variant="outlined"
                        name="firstName"
                        value={credential.firstName}
                        onChange={handleChange}
                        fullWidth
                    />
                </div>
                <div className="form-group">
                    <TextField
                        id="lastName"
                        label="Last Name"
                        variant="outlined"
                        name="lastName"
                        value={credential.lastName}
                        onChange={handleChange}
                        fullWidth
                    />
                </div>
                <div className="form-group">
                    <TextField
                        id="birthdate"
                        label="Birthdate"
                        type="date"
                        variant="outlined"
                        name="birthdate"
                        value={credential.birthdate}
                        onChange={handleChange}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        fullWidth
                    />
                </div>
                <div className="form-group">
                    <TextField
                        id="email"
                        label="Email"
                        variant="outlined"
                        name="email"
                        value={credential.email}
                        onChange={handleChange}
                        fullWidth
                    />
                </div>
                <div className="form-group">
                    <TextField
                        id="password"
                        label="Password"
                        type="password"
                        variant="outlined"
                        name="password"
                        value={credential.password}
                        onChange={handleChange}
                        fullWidth
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
                <Button
                    variant="contained"
                    className="submit-button"
                    onClick={handleSignup}
                    fullWidth
                    disabled={loading}  // Disable button when loading
                >
                    {loading ? <CircularProgress size={24} /> : "Sign Up"}
                </Button>
            </div>
        </Box>
    );
}
