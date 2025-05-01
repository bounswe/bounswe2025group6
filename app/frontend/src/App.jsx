import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

// Only include the pages that are done
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

function Layout() {
  return (
    <>     
      <main className="min-h-screen px-4 py-6">
        <Outlet />
      </main>
    </>
  );
}
function App() {
  return (

  <BrowserRouter>
    <Routes>

    <Route element={<Layout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Route>
    </Routes>
    </BrowserRouter>

  );
}


export default App;