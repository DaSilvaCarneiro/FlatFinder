import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../config/firebase";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import CircularIndeterminate from "./Loading";
import "../styles/NewFlat.css";

const EditPage = () => {
    
    const { flatId } = useParams(); // Retrieve flatId from the URL
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState<boolean>(false); // Check if current user is the owner
    const [isAdmin, setIsAdmin] = useState<boolean>(false); // Check if current user is an admin

    // Form fields
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [area, setArea] = useState("");
    const [city, setCity] = useState("");
    const [street, setStreet] = useState("");
    const [number, setNumber] = useState("");
    const [ac, setAc] = useState(false);
    const [yearBuilt, setYearBuilt] = useState("");
    const [dateAvailable, setDateAvailable] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Fetch flat details and check if current user is the owner or admin
    useEffect(() => {
        const fetchFlat = async () => {
            try {
                if (!flatId) {
                    setError("Flat ID is missing");
                    return;
                }
    
                const flatDocRef = doc(db, "flats", flatId); // Get reference to the flat document
                const flatSnapshot = await getDoc(flatDocRef); // Fetch the flat document
    
                if (flatSnapshot.exists()) {
                    const flatData = flatSnapshot.data();
                    console.log(flatData); // Log the flat data for debugging
    
                    // Check if the required fields exist in the flat data
                    if (!flatData.title || !flatData.city || !flatData.street || !flatData.dateAvailable) {
                        setError("Required fields are missing");
                        return;
                    }
    
                    // Convert fields from string to number
                    const price = Number(flatData.price);
                    const area = Number(flatData.area);
                    const yearBuilt = Number(flatData.yearBuilt); // Assuming it's stored as a string
                    const dateAvailableDate = flatData.dateAvailable?.toDate ? flatData.dateAvailable.toDate() : new Date(flatData.dateAvailable);
    
                    // Fetch the current user's admin status from the Firestore users collection
                    const user = auth.currentUser;
                    if (user) {
                        // Fetch user data from Firestore
                        const userDocRef = doc(db, "users", user.uid);
                        const userSnapshot = await getDoc(userDocRef);
    
                        if (userSnapshot.exists()) {
                            const userData = userSnapshot.data();
                            // Check if the user is an admin
                            setIsAdmin(userData?.isAdmin === true); // Assuming isAdmin is stored in the users collection
    
                            // Check if the user is the owner of the flat
                            if (user.email === flatData.ownerEmail) {
                                setIsOwner(true);
                            }
                        }
                    }
    
                    // Populate form fields with existing data
                    setTitle(flatData.title);
                    setPrice(price.toString()); // Store as string in state
                    setArea(area.toString()); // Store as string in state
                    setCity(flatData.city);
                    setStreet(flatData.street);
                    setNumber(flatData.number.toString()); // Assuming `number` is a string in Firestore
                    setAc(flatData.ac);
                    setYearBuilt(yearBuilt.toString()); // Store as string in state
                    setDateAvailable(dateAvailableDate ? dateAvailableDate.toISOString().split("T")[0] : "");
                } else {
                    setError("Flat not found");
                }
            } catch (err) {
                setError("Error fetching flat details");
                console.error("Error fetching flat:", err);
            } finally {
                setLoading(false);
            }
        };
    
        fetchFlat();
    }, [flatId]);
    
    



    // Validation rules
    const validateField = (name: string, value: string) => {
        switch (name) {
            case 'title':
                if (value.length < 5) return 'Title must be at least 5 characters long.';
                break;
            case 'price':
                if (isNaN(Number(value)) || Number(value) <= 0) return 'Price must be a positive number.';
                break;
            case 'area':
                if (isNaN(Number(value)) || Number(value) <= 0) return 'Area must be a positive number.';
                if (Number(value) < 20) return 'Area must be at least 20 m².';
                break;
            case 'city':
                if (value.length < 3) return 'City must be at least 3 characters long.';
                break;
            case 'street':
                if (value.length < 3) return 'Street name must be at least 3 characters long.';
                break;
            case 'number':
                if (isNaN(Number(value)) || Number(value) <= 0) return 'Flat number must be a positive number.';
                break;
            case 'yearBuilt':
                if (isNaN(Number(value)) || Number(value) > new Date().getFullYear() || Number(value) < 1900) return 'Year built must be a valid year.';
                break;
            case 'dateAvailable':
                if (!Date.parse(value)) return 'Invalid date format. Use YYYY-MM-DD.';
                break;
            default:
                return '';
        }
        return '';
    };

    // Handle input change and validate
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const error = validateField(name, value);

        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: error,
        }));

        switch (name) {
            case 'title':
                setTitle(value);
                break;
            case 'price':
                setPrice(value);
                break;
            case 'area':
                setArea(value);
                break;
            case 'city':
                setCity(value);
                break;
            case 'street':
                setStreet(value);
                break;
            case 'number':
                setNumber(value);
                break;
            case 'ac':
                setAc(!ac);
                break;
            case 'yearBuilt':
                setYearBuilt(value);
                break;
            case 'dateAvailable':
                setDateAvailable(value);
                break;
            default:
                break;
        }
    };

    // Check if the form is valid
    const isFormValid = () => {
        return (
            Object.values(errors).every((error) => !error) &&
            title &&
            price &&
            area &&
            city &&
            street &&
            number &&
            yearBuilt &&
            dateAvailable
        );
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid()) {
            alert('Please fix all errors before submitting.');
            return;
        }

        try {
            await updateDoc(doc(db, "flats", flatId!), {
                title,
                price: Number(price),
                area: Number(area),
                city,
                street,
                number: Number(number),
                ac,
                yearBuilt: Number(yearBuilt),
                dateAvailable: new Date(dateAvailable),
            });
            alert('Flat updated successfully!');
            navigate(`/flat/${flatId}`); // Redirect to flat detail page
        } catch (error) {
            alert('Error updating flat: ' + error);
        }
    };

    if (loading) return <div className="loading"><CircularIndeterminate /></div>;
    if (error) return <div>{error}</div>;
    if (!(isOwner || isAdmin)) return <div>You are not authorized to edit this flat.</div>;

    return (
        <div className="new-flat-container">
            <h1 className="new-flat-title">Edit Flat</h1>
            <form onSubmit={handleSubmit} className="new-flat-form">
                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        placeholder="Enter flat title"
                        value={title}
                        onChange={handleChange}
                        required
                    />
                    {errors.title && <span className="error-message">{errors.title}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="price">Price (€)</label>
                    <input
                        type="text"
                        id="price"
                        name="price"
                        placeholder="Enter price"
                        value={price}
                        onChange={handleChange}
                        required
                    />
                    {errors.price && <span className="error-message">{errors.price}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="area">Area (m²)</label>
                    <input
                        type="text"
                        id="area"
                        name="area"
                        placeholder="Enter area"
                        value={area}
                        onChange={handleChange}
                        required
                    />
                    {errors.area && <span className="error-message">{errors.area}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                        type="text"
                        id="city"
                        name="city"
                        placeholder="Enter city"
                        value={city}
                        onChange={handleChange}
                        required
                    />
                    {errors.city && <span className="error-message">{errors.city}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="street">Street</label>
                    <input
                        type="text"
                        id="street"
                        name="street"
                        placeholder="Enter street"
                        value={street}
                        onChange={handleChange}
                        required
                    />
                    {errors.street && <span className="error-message">{errors.street}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="number">Number</label>
                    <input
                        type="text"
                        id="number"
                        name="number"
                        placeholder="Enter flat number"
                        value={number}
                        onChange={handleChange}
                        required
                    />
                    {errors.number && <span className="error-message">{errors.number}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="ac">Air Conditioning</label>
                    <input
                        type="checkbox"
                        id="ac"
                        name="ac"
                        checked={ac}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="yearBuilt">Year Built</label>
                    <input
                        type="text"
                        id="yearBuilt"
                        name="yearBuilt"
                        placeholder="Enter year built"
                        value={yearBuilt}
                        onChange={handleChange}
                        required
                    />
                    {errors.yearBuilt && <span className="error-message">{errors.yearBuilt}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="dateAvailable">Date Available</label>
                    <input
                        type="date"
                        id="dateAvailable"
                        name="dateAvailable"
                        value={dateAvailable}
                        onChange={handleChange}
                        required
                    />
                    {errors.dateAvailable && <span className="error-message">{errors.dateAvailable}</span>}
                </div>
                <button type="submit" className="submit-button" disabled={!isFormValid()}>
                    Save Changes
                </button>
            </form>
        </div>
    );
};

export default EditPage;
