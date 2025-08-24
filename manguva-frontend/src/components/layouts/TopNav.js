import { Button, Space, Typography, Avatar, Badge, Dropdown, Menu } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import ThemeToggle from './ThemeToggle';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../app/features/authSlice';

const { Text } = Typography;

const TopNav = ({ collapsed, setCollapsed, mobileView }) => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const menu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="top-nav-container">
      <div className="left-content">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          className="collapse-btn"
        />
        {!mobileView && (
          <Text strong className="app-name">
            Boutique Management
          </Text>
        )}
      </div>
      
      <div className="right-content">
        <ThemeToggle />
        <Dropdown overlay={menu} trigger={['click']}>
          <Badge dot>
            <Avatar 
              shape="square" 
              icon={<UserOutlined />}
              className="user-avatar"
            />
          </Badge>
        </Dropdown>
      </div>
    </div>
  );
};

export default TopNav;