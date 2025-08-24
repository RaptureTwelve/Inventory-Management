import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { useSelector } from 'react-redux';
import TopNav from './TopNav';
import SideNav from './SideNav';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const currentTheme = useSelector((state) => state.auth.theme);

  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
      if (window.innerWidth < 768) setCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Layout className={`app-layout theme-${currentTheme}`}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        collapsedWidth={mobileView ? 0 : 80}
        className={`side-nav ${collapsed ? 'collapsed' : ''}`}
      >
        <SideNav collapsed={collapsed} />
      </Sider>
      <Layout className={`main-layout ${collapsed ? 'collapsed' : ''}`}>
        <Header className="header">
          <TopNav 
            collapsed={collapsed} 
            setCollapsed={setCollapsed} 
            mobileView={mobileView}
          />
        </Header>
        <Content className="content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;