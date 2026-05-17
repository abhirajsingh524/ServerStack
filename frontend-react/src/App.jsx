import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1d27',
            color: '#e8eaf6',
            border: '1px solid #2e3250',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#40c97e', secondary: '#1a1d27' } },
          error:   { iconTheme: { primary: '#ff4d6d', secondary: '#1a1d27' } },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
