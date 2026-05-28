import React, { useContext, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { setNavigateCallback } from './services/api';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Watch from './pages/Watch';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Channel from './pages/Channel';
import CreateChannel from './pages/CreateChannel';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorStudio from './pages/CreatorStudio';
import Trending from './pages/Trending';
import Subscriptions from './pages/Subscriptions';
import History from './pages/History';
import WatchLater from './pages/WatchLater';
import Library from './pages/Library';
import Playlist from './pages/Playlist';
import Search from './pages/Search';
import ForgotPassword from './pages/ForgotPassword';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import FocusMode from './pages/FocusMode';
import ProductivityDashboard from './pages/ProductivityDashboard';
import NotesDashboard from './pages/NotesDashboard';
import LearningDashboard from './pages/LearningDashboard';
import LearningPathDetail from './pages/LearningPathDetail';
import CodePlayground from './pages/CodePlayground';
import CommunityRooms from './pages/CommunityRooms';
import CareerNavigator from './pages/CareerNavigator';
import ProjectBuilder from './pages/ProjectBuilder';
import ProjectReview from './pages/ProjectReview';
import ShortsStudio from './pages/ShortsStudio';
import UploaderDashboard from './pages/UploaderDashboard';
import WatchInvite from './pages/WatchInvite';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigateCallback(() => navigate('/login'));
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/invite/:token" element={<WatchInvite />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="watch/:id" element={<Watch />} />
        <Route path="upload" element={<Upload />} />
        <Route path="channel/:id" element={<Channel />} />
        <Route path="create-channel" element={<CreateChannel />} />
        <Route path="dashboard" element={<CreatorDashboard />} />
        <Route path="studio" element={<CreatorStudio />} />
        <Route path="trending" element={<Trending />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="history" element={<History />} />
        <Route path="watch-later" element={<WatchLater />} />
        <Route path="library" element={<Library />} />
        <Route path="liked" element={<Library />} />
        <Route path="playlist/:id" element={<Playlist />} />
        <Route path="search" element={<Search />} />
        <Route path="focus" element={<FocusMode />} />
        <Route path="productivity" element={<ProductivityDashboard />} />
        <Route path="notes" element={<NotesDashboard />} />
        <Route path="learning" element={<LearningDashboard />} />
        <Route path="learning-path/:id" element={<LearningPathDetail />} />
        <Route path="playground" element={<CodePlayground />} />
        <Route path="rooms" element={<CommunityRooms />} />
        <Route path="career" element={<CareerNavigator />} />
        <Route path="project-builder" element={<ProjectBuilder />} />
        <Route path="project-review" element={<ProjectReview />} />
        <Route path="shorts-studio" element={<ShortsStudio />} />
        <Route path="profile/:id" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="uploader" element={<UploaderDashboard />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route
          path="admin-dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
