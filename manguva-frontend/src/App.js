import { useEffect } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/login';
import Dashboard from './pages/Dashboard';
import AppLayout from './components/layouts/AppLayout';
import { selectCurrentTheme, verifyAuth } from './app/features/authSlice';
import useAxiosSetup from './utils/axiosSetup';
import Vendors from './pages/vendors';
import Products from './pages/products';
import ProductInventory from './pages/product-inventory';
import Inventory from './pages/inventory';
import BillingPage from './pages/billing';
import OrdersList from './pages/ordersList';
import VendorAnalytics from './pages/vendorsAnalysis';
import TailorOrderList from './pages/TailorOrderList';
import DailyReportGenerator from './pages/report';
const App = () => {
  const currentTheme = useSelector(selectCurrentTheme);
  const dispatch = useDispatch();

  useAxiosSetup();
  dispatch(verifyAuth());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <BrowserRouter basename={process.env.REACT_APP_BASE_PATH}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id/inventory" element={<ProductInventory />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/orders" element={<OrdersList />} />
              <Route path="/vendors/vendor-analytics/:id" element={<VendorAnalytics />} />
              <Route path="/tailor-orders" element={<TailorOrderList />} />
              <Route path="/report" element={<DailyReportGenerator />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;