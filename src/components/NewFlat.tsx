import { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase'; // Import auth from your firebase config
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import '../styles/NewFlat.css';

const NewFlat = () => {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [area, setArea] = useState('');
    const [city, setCity] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [ac, setAc] = useState(false);
    const [yearBuilt, setYearBuilt] = useState('');
    const [dateAvailable, setDateAvailable] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [currentUser, setCurrentUser] = useState<{
        uid: string;
        firstName: string;
        lastName: string;
        email: string;
    } | null>(null);
    const [images, setImages] = useState<File[]>([]);
    const [imageErrors, setImageErrors] = useState('');
    const navigate = useNavigate();

    // Fetch the current user when the component mounts
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            console.log('Auth State Changed:', user); // Debugging
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnapshot = await getDoc(userDocRef);
                console.log('User Document Exists:', userDocSnapshot.exists()); // Debugging
                if (userDocSnapshot.exists()) {
                    const userData = userDocSnapshot.data();
                    setCurrentUser({
                        uid: user.uid,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        email: userData.email,
                    });
                }
            } else {
                setCurrentUser(null); // No user is logged in
            }
        });

        return () => unsubscribe(); // Cleanup the observer on unmount
    }, []);

    // Validate form fields
    const validateField = (name: string, value: string) => {
        switch (name) {
            case 'title':
                if (value.length < 5)
                    return 'Title must be at least 5 characters long.';
                break;
            case 'price':
                if (isNaN(Number(value)) || Number(value) <= 0)
                    return 'Price must be a positive number.';
                break;
            case 'area':
                if (isNaN(Number(value)) || Number(value) <= 0)
                    return 'Area must be a positive number.';
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

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked } = e.target;
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
                setAc(checked);
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
            dateAvailable &&
            images.length >= 1 &&
            images.length <= 5
        );
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid()) {
            alert('Please fix all errors before submitting.');
            return;
        }

        if (!currentUser) {
            alert('You must be logged in to add a flat.');
            return;
        }

        try {
            const storage = getStorage();
            const imageUrls = [];

            // Upload each image to Firebase Storage
            for (const image of images) {
                const imageName = `${Date.now()}_${image.name}`; // Unique filename
                const storageRef = ref(storage, `flats/${currentUser.uid}/${imageName}`);
                await uploadBytes(storageRef, image);
                const downloadURL = await getDownloadURL(storageRef);
                imageUrls.push(downloadURL);
            }

            // Save flat data to Firestore
            await addDoc(collection(db, 'flats'), {
                title,
                price: Number(price),
                area: Number(area),
                city,
                street,
                number: Number(number),
                ac,
                ownerName: `${currentUser.firstName} ${currentUser.lastName}`,
                ownerEmail: currentUser.email,
                yearBuilt: Number(yearBuilt),
                dateAvailable: new Date(dateAvailable),
                images: imageUrls, // Save image URLs
            });

            alert('Flat added successfully!');
            navigate('/');
        } catch (error) {
            alert('Error adding flat: ' + error);
        }
    };

    return (
        <div className="new-flat-container">
            <h1 className="new-flat-title">Add New Flat</h1>
            <form onSubmit={handleSubmit} className="new-flat-form">
                {/* Title */}
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

                {/* Price */}
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

                {/* Area */}
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

                {/* City */}
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

                {/* Street */}
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

                {/* Number */}
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

                {/* Air Conditioning */}
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

                {/* Year Built */}
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

                {/* Date Available */}
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

                {/* Image Upload */}
                <div className="form-group">
                    <label htmlFor="images">Upload Images (1-5)</label>
                    <input
                        type="file"
                        id="images"
                        name="images"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                                const fileList = Array.from(files);
                                if (fileList.length > 5) {
                                    setImageErrors('You can upload a maximum of 5 images.');
                                } else {
                                    setImages(fileList);
                                    setImageErrors('');
                                }
                            }
                        }}
                    />
                    {imageErrors && <span className="error-message">{imageErrors}</span>}
                </div>

                {/* Submit Button */}
                <button type="submit" className="submit-button" disabled={!isFormValid()}>
                    Add Flat
                </button>
            </form>
        </div>
    );
};

export default NewFlat;