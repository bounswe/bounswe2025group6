// src/App.jsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

// Layout Components
import NavBar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import RecipeDiscoveryPage from './pages/RecipeDiscoveryPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import UploadRecipePage from './pages/UploadRecipePage';
import CommunityPage from './pages/CommunityPage';
import ForumPostPage from './pages/ForumPostPage';
import NewPostPage from './pages/NewPostPage';
import MealPlannerPage from './pages/MealPlannerPage';
import ShoppingListPage from './pages/ShoppingListPage';
import SavedMealPlansPage from './pages/SavedMealPlansPage';

// Optional: import ProtectedRoute later if you implement auth
// import ProtectedRoute from './router/ProtectedRoute';

// Main layout wrapper including Navbar and Footer
function Layout() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-6">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Dashboard & Profile */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Recipe Section */}
          <Route path="/recipes" element={<RecipeDiscoveryPage />} />
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
          <Route path="/upload-recipe" element={<UploadRecipePage />} />

          {/* Community Forum Section */}
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/forum/:id" element={<ForumPostPage />} />
          <Route path="/community/new" element={<NewPostPage />} />

          {/* Meal Planning Section */}
          <Route path="/meal-planner" element={<MealPlannerPage />} />
          <Route path="/shopping-list" element={<ShoppingListPage />} />
          <Route path="/saved-meal-plans" element={<SavedMealPlansPage />} />
        </Route>

        {/* TODO: Add a 404 Not Found page if needed */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;