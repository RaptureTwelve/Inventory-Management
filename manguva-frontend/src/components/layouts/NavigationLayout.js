import { useState, useEffect } from 'react';
import { Layout, theme } from 'antd';
import { useSelector } from 'react-redux';
import TopNav from './TopNav';
import SideNav from './SideNav';
import './NavigationLayout.less';

const { Header, Sider, Content } = Layout;

const NavigationLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const currentTheme = useSelector((state) => state.auth.theme);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

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
    <Layout className={`nav-layout theme-${currentTheme}`}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        collapsedWidth={mobileView ? 0 : 80}
        className="sider"
      >
        <SideNav collapsed={collapsed} />
      </Sider>
      <Layout>
        <Header className="header" style={{ background: colorBgContainer }}>
          <TopNav 
            collapsed={collapsed} 
            setCollapsed={setCollapsed} 
            mobileView={mobileView}
          />
        </Header>
        <Content className="content">{children}</Content>
      </Layout>
    </Layout>
  );
};

export default NavigationLayout;