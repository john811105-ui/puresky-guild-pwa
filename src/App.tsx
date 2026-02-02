import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './lib/AppContext';
import Layout from './components/Layout';
import ProfilePage from './pages/ProfilePage';
import BountyPage from './pages/BountyPage';
import ShopPage from './pages/ShopPage';
import TreasurePage from './pages/TreasurePage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/profile" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="bounty" element={<BountyPage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="treasure" element={<TreasurePage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
