import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/user/Navbar';
import Sidebar from '../../components/user/Sidebar';
import AnnouncementBanner from '../../components/shared/AnnouncementBanner';
import '../../styles/user/dashboard.css';

const UserLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="layout-container">
      {/* System Announcement Top Banner */}
      <AnnouncementBanner />

      {/* Top Fixed Navbar */}
      <Navbar onMenuToggle={toggleMobileSidebar} isMobileOpen={isMobileOpen} />

      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobileSidebar}></div>
      )}

      {/* Main Layout Body Flex Container */}
      <div className="layout-body">
        {/* Reserved Width Desktop Sidebar / Mobile Drawer */}
        <Sidebar isMobileOpen={isMobileOpen} closeSidebar={closeMobileSidebar} />

        {/* Non-overlapping Main Viewport Area */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
