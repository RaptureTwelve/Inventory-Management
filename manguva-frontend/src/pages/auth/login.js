import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Space, Button, Form, Input, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { loginUser, selectIsAuthenticated } from '../../app/features/authSlice';

const { Title, Text } = Typography;

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [loading, setLoading] = useState(false);
  const role = useSelector((state) => state.auth.role);

  useEffect(() => {
      if (isAuthenticated) {
        if (role === 2) {
          navigate('/dashboard', { replace: true });
        } else if (role === 1) {
          navigate('/products', { replace: true });
        }
      }
    }, [isAuthenticated, role, navigate]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const result = await dispatch(loginUser(values)).unwrap();

      message.success('Login successful');

      if (result.user.role === 2) {
        navigate('/dashboard', { replace: true });
      } else if (result.user.role === 1) {
        navigate('/products', { replace: true });
      } else {
        navigate('/', { replace: true }); 
      }
    } catch (error) {
      message.error(error.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Space direction="vertical" size="large" className="login-content">
          <div className="login-header">
            <Title level={2} className="login-title">
              Manguva POS
            </Title>
            <Text type="secondary" className="login-subtitle">
              Boutique Management System
            </Text>
          </div>
          
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
            className="login-form"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="login-input-icon" />}
                placeholder="Email"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="login-input-icon" />}
                placeholder="Password"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-button"
              >
                Log in
              </Button>
            </Form.Item>
          </Form>
          
          <div className="login-footer">
            <Text type="secondary" className="login-footer-text">
              Admin access only
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default LoginPage;