import { Outlet } from 'react-router-dom';
import '../../styles/admin/admin.css';

const AdminLayout = () => {
  return (
    <div className="admin-theme-root">
      <Outlet />
    </div>
  );
};

export default AdminLayout;
