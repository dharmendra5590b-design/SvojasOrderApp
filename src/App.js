import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Admin
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomerMaster from './pages/admin/CustomerMaster';
import EmployeeMaster from './pages/admin/EmployeeMaster';
import CustomerMapping from './pages/admin/CustomerMapping';
import LedgerEntry from './pages/admin/LedgerEntry';
import CustomerOrderReport from './pages/admin/CustomerOrderReport';
import CustomerLedgerReport from './pages/admin/CustomerLedgerReport';

// Admin User
import AdminUserLayout from './components/admin/AdminLayout';
import AdminUserDashboard from './pages/adminuser/AdminUserDashboard';
import OrderWorkflow from './pages/adminuser/OrderWorkflow';

// Customer
import CustomerLayout from './components/customer/CustomerLayout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import NewOrder from './pages/customer/NewOrder';
import OrderSearch from './pages/customer/OrderSearch';
import ConfirmOrder from './pages/customer/ConfirmOrder';

// Designer
import DesignerLayout from './components/designer/DesignerLayout';
import DesignerDashboard from './pages/designer/DesignerDashboard';
import DesignerTaskReport from './pages/designer/Designertaskreport';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.user_Type)) return <Navigate to="/unauthorized" />;
  if (user.isFirstLogin && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" />;
  }
  return children;
};

const RoleRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  const routes = {
    admin: '/admin/dashboard',
    admin_user: '/adminuser/dashboard',
    customer: '/customer/orders',
    designer: '/designer/orders',
    data_entry: '/admin/ledger'
  };
  return <Navigate to={routes[user.user_Type] || '/login'} />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
          <Route path="/" element={<RoleRouter />} />

          {/* ADMIN */}
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}>
            <AdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="customers" element={<CustomerMaster />} />
            <Route path="employees" element={<EmployeeMaster />} />
            <Route path="mapping" element={<CustomerMapping />} />
            <Route path="ledger" element={<LedgerEntry />} />
            <Route path="order-report" element={<CustomerOrderReport />} />
            <Route path="ledger-report" element={<CustomerLedgerReport />} />
          </Route>

          {/* ADMIN USER */}
          <Route path="/adminuser" element={<ProtectedRoute roles={['ADMINUSER','ADMIN']}>
            <AdminUserLayout role="ADMINUSER" /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminUserDashboard />} />
            <Route path="orders/:status?" element={<OrderWorkflow />} />
            <Route path="order-report" element={<CustomerOrderReport />} />
          </Route>

          {/* CUSTOMER */}
          <Route path="/customer" element={<ProtectedRoute roles={['CUSTOMER']}><CustomerLayout /></ProtectedRoute>}>
            <Route path="orders" element={<OrderSearch />} />
            <Route path="new-order" element={<NewOrder />} />
            <Route path="confirm-order" element={<ConfirmOrder />} />
            <Route path="ledger" element={<CustomerLedgerReport />} />
          </Route>

          {/* DESIGNER */}
          <Route path="/designer" element={<ProtectedRoute roles={['DESIGNER']}><DesignerLayout /></ProtectedRoute>}>
            <Route path="orders" element={<DesignerDashboard />} />
            <Route path="task-report" element={<DesignerTaskReport />} />
          </Route>

          <Route path="/unauthorized" element={<div className="container mt-5 text-center"><h2>Access Denied</h2></div>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;