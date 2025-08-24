import axios from './axiosConfig';
import store from '../app/store';
import { logoutUser } from '../app/features/authSlice';

// Setup Axios interceptors
const useAxiosSetup = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      // if (config.url && config.url.includes('/dashboard/')) {
      //   return config;
      // }
      
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const originalRequest = error.config;
      
      // Skip auto-logout for dashboard endpoints during development
      if (originalRequest.url && originalRequest.url.includes('/dashboard/')) {
        return Promise.reject(error);
      }
      
      // Auto-logout on 401
      if (error.response?.status === 401 && !originalRequest._retry) {
        const token = localStorage.getItem("accessToken");
        if (token) {
          store.dispatch(logoutUser());
        }
      }

      return Promise.reject(error);
    }
  );
};

export default useAxiosSetup;