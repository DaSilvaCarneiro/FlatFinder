import { useState } from "react";
import { TextField, Box, Button, CircularProgress } from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { useNavigate } from 'react-router-dom';
import "../styles/Login.css";

interface CredentialType {
    email: string;
    password: string;
}

export default function Login() {
    const [credential, setCredential] = useState<CredentialType>({
        email: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredential({ ...credential, [e.target.name]: e.target.value });
    };

    const handleLogin = async () => {
        if (!credential.email || !credential.password) {
            setError("Email and password are required.");
            return;
        }

        try {
            setLoading(true);
            await signInWithEmailAndPassword(auth, credential.email, credential.password);
            setSuccess("Login successful! Redirecting...");
            setError(null);
            setTimeout(() => navigate("/"), 1500); // Delay for message visibility
        } catch (err) {
            setError("Failed to log in. Check your credentials.");
            setSuccess(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" className="login-container" noValidate autoComplete="off">
            <div className="login-title">Login</div>
            <div className="login-form">
                <div className="login-form-group">
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
                <div className="login-form-group">
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
                {error && <p className="login-error-message">{error}</p>}
                {success && <p className="login-success-message">{success}</p>}
                <Button
                    variant="contained"
                    className="login-submit-button"
                    onClick={handleLogin}
                    fullWidth
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : "Login"}
                </Button>
            </div>
        </Box>
    );
}