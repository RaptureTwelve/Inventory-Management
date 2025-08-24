import { Menu } from 'antd';
import { 
  DashboardOutlined, 
  ShopOutlined,
  TagsOutlined,
  DatabaseOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  ScissorOutlined,
  AuditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const SideNav = ({ collapsed }) => {
    const navigate = useNavigate()
    const role = useSelector((state) => state.auth.role);

    const menuItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
      {
        key: '/vendors',
        icon: <ShopOutlined />,
        label: 'Vendors',
      },
      {
        key: '/products',
        icon: <TagsOutlined />,  
        label: 'Products',
      },
      {
        key: '/inventory',
        icon: <DatabaseOutlined />, 
        label: 'Inventory',
      },
      {
        key: '/billing',
        icon: <ShoppingCartOutlined />, 
        label: 'POS',
      },
      {
        key: '/orders',
        icon: <ShoppingOutlined />, 
        label: 'Orders',
      },
      {
        key: '/tailor-orders',
        icon: <ScissorOutlined />, 
        label: 'Tailor',
      },
      {
        key: '/report',
        icon: <AuditOutlined />, 
        label: 'Report',
      },
    ];
  
    const filteredItems = role === 1 
      ? menuItems.filter(item => 
          item.key === '/products' || item.key === '/billing'
        )
      : menuItems; 
  
    return (
      <div className="side-nav-container">
        <div className="logo-container">
          {collapsed ? (
            <div className="logo-icon">M</div>
          ) : (
            <div className="logo-full">Manguva POS</div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[window.location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={filteredItems}
          className="nav-menu"
        />
      </div>
    );
  };
  
  export default SideNav;