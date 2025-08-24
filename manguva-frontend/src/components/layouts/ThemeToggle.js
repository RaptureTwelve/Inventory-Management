import { Button, Tooltip, theme } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme } from '../../app/features/authSlice';

const ThemeToggle = () => {
  const { token } = theme.useToken();
  const currentTheme = useSelector((state) => state.auth.theme);
  const dispatch = useDispatch();

  const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    dispatch(setTheme(newTheme));
  };

  return (
    <Tooltip title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}>
      <Button
        type="text"
        icon={currentTheme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
        onClick={toggleTheme}
        style={{ color: token.colorText }}
      />
    </Tooltip>
  );
};

export default ThemeToggle;