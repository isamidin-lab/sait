import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import HomePage from './pages/HomePage';
import AskPage from './pages/AskPage';
import LoginPage from './pages/LoginPage';
import ArticlePage from './pages/ArticlePage';
import ArticlesPage from './pages/ArticlesPage';
import CategoryPage from './pages/CategoryPage';
import QuranPage from './pages/QuranPage';
import AdminLayout from './pages/admin/AdminLayout';
import PendingQuestions from './pages/admin/PendingQuestions';
import ArchivePage from './pages/admin/ArchivePage';
import CategoriesPage from './pages/admin/CategoriesPage';
import AdminsPage from './pages/admin/AdminsPage';
import ProductsPage from './pages/admin/ResourcesPage';
import WalletsPage from './pages/admin/WalletsPage';
import AdminArticlesPage from './pages/admin/ArticlesPage';
import QuranManagementPage from './pages/admin/QuranManagementPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="flex flex-col min-h-screen">
            <Routes>
              <Route
                path="/admin"
                element={<AdminLayout />}
              >
                <Route index element={<PendingQuestions />} />
                <Route path="archive" element={<ArchivePage />} />
                <Route path="articles" element={<AdminArticlesPage />} />
                <Route path="quran" element={<QuranManagementPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="resources" element={<ProductsPage />} />
                <Route path="wallets" element={<WalletsPage />} />
                <Route path="admins" element={<AdminsPage />} />
              </Route>
              <Route
                path="*"
                element={
                  <>
                    <Header />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/ask" element={<AskPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/article/:id" element={<ArticlePage />} />
                        <Route path="/articles" element={<ArticlesPage />} />
                        <Route path="/category/:slug" element={<CategoryPage />} />
                        <Route path="/quran" element={<QuranPage />} />
                      </Routes>
                    </main>
                    <Footer />
                  </>
                }
              />
            </Routes>
            <ToastContainer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
