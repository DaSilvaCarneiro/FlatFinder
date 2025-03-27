import './App.css';
import { Route, Routes } from 'react-router-dom';
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import NewFlat from "./components/NewFlat";
import FlatDetailPage from "./components/FlatDetailPage";
import Login from './components/Login';
import SignUp from './components/SignUp';
import Profile from './components/Profile';
import AdminPage from './components/AdminPage';
import FavoritesPage from './components/FavoritesPage';
import EditPage from './components/EditPage';
import MyFlatsPage from './components/MyFlatsPage';
import { FavoritesProvider } from './components/FavoritesContext';
function App() {
  return (
    <FavoritesProvider>
      <div className="App">
        <div className='NavBar'>
          <Header />
        </div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/new-flat" element={<NewFlat />} />
          <Route path="/flat/:flatId" element={<FlatDetailPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/edit-flat/:flatId" element={<EditPage />} />
          <Route path="/my-flats" element={<MyFlatsPage />} />
        </Routes>
      </div>
    </FavoritesProvider>
  );
}

export default App;