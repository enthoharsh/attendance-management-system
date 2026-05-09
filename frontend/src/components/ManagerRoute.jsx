import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ManagerRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  
  if (!userInfo) return <Navigate to="/login" replace />;
  
  if (userInfo.role !== 'manager') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ManagerRoute;
