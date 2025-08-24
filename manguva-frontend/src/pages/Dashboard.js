import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import './Dashboard.css';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Space,
  Avatar,
  Tag,
  Progress,
  Spin,
  Alert,
  Badge,
  List,
  Tooltip,
  Select,
  Button,
  Divider,
  Empty,
  Segmented,
  message,
  theme
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  AppstoreOutlined,
  RiseOutlined,
  FallOutlined,
  EyeOutlined,
  BellOutlined,
  CalendarOutlined,
  WarningOutlined,
  TrophyOutlined,
  FireOutlined,
  TeamOutlined,
  StockOutlined,
  CreditCardOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  GiftOutlined,
  StarOutlined,
  AreaChartOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesChartData, setSalesChartData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [paymentStats, setPaymentStats] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [vendorPerformance, setVendorPerformance] = useState([]);
  const [vendorMetric, setVendorMetric] = useState('revenue');
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState('area');

  // Get current theme from Redux store
  const currentTheme = useSelector((state) => state.auth.theme);
  const { token } = theme.useToken();

  // Theme-aware color palette
  const getThemeColors = () => {
    const isDark = currentTheme === 'dark';
    return {
      primary: isDark ? '#9333ea' : '#8B5CF6',
      secondary: isDark ? '#0891b2' : '#06B6D4', 
      success: isDark ? '#059669' : '#10B981',
      warning: isDark ? '#d97706' : '#F59E0B',
      error: isDark ? '#dc2626' : '#EF4444',
      info: isDark ? '#2563eb' : '#3B82F6',
      purple: isDark ? '#9333ea' : '#8B5CF6',
      cyan: isDark ? '#0891b2' : '#06B6D4',
      emerald: isDark ? '#059669' : '#10B981',
      amber: isDark ? '#d97706' : '#F59E0B',
      rose: isDark ? '#e11d48' : '#F43F5E',
      gradient1: isDark ? 'linear-gradient(135deg, #4338ca 0%, #581c87 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      gradient2: isDark ? 'linear-gradient(135deg, #be185d 0%, #9f1239 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      gradient3: isDark ? 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      gradient4: isDark ? 'linear-gradient(135deg, #047857 0%, #059669 100%)' : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      gradient5: isDark ? 'linear-gradient(135deg, #be185d 0%, #d97706 100%)' : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      gradient6: isDark ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)' : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      cardBg: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.95)',
      cardBorder: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(255,255,255,0.2)',
      textPrimary: isDark ? '#f9fafb' : '#1a1a1a',
      textSecondary: isDark ? '#d1d5db' : '#666',
      chartGrid: isDark ? '#374151' : '#f0f0f0'
    };
  };

  const chartColors = getThemeColors();

  // Enhanced statistics with better animations and insights
  const getInsightColor = (value, type = 'growth') => {
    if (type === 'growth') {
      return value > 0 ? chartColors.success : value < 0 ? chartColors.error : chartColors.info;
    }
    return chartColors.primary;
  };

  const formatInsight = (value, type = 'growth') => {
    if (type === 'growth') {
      const icon = value > 0 ? <ArrowUpOutlined /> : value < 0 ? <ArrowDownOutlined /> : <span>—</span>;
      return (
        <span style={{ color: getInsightColor(value, type), fontWeight: 'bold' }}>
          {icon} {Math.abs(value)}%
        </span>
      );
    }
    return value;
  };

  // Fetch all dashboard data with enhanced error handling
  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch analytics data from Django API
      const analyticsRes = await axios.get(`/dashboard/analytics/?days=${selectedPeriod}`);
      const data = analyticsRes.data;

      // Validate response data
      if (!data) {
        throw new Error('No data received from server');
      }

      // Set main dashboard data
      setDashboardData({
        total_revenue: data.total_revenue || 0,
        total_orders: data.total_orders || 0,
        total_products: data.total_products || 0,
        total_inventory_value: data.total_inventory_value || 0,
        revenue_growth: data.revenue_growth || 0,
        orders_growth: data.orders_growth || 0,
        avg_order_value: data.avg_order_value || 0,
        items_sold: data.items_sold || { last_30_days: 0 },
        products: data.products || { low_stock: 0, out_of_stock: 0 },
        new_products_this_month: data.new_products_this_month || 0,
        inventory_turnover: data.inventory_turnover || 0,
        products_growth: data.products_growth || 0,
        inventory_growth: data.inventory_growth || 0
      });

      // Process and combine monthly data
      const monthlyRevenue = data.monthly_revenue || [];
      const monthlyOrders = data.monthly_orders || [];
      
      const combinedSalesData = monthlyRevenue.map(revenueItem => {
        const orderItem = monthlyOrders.find(o => o.month === revenueItem.month) || {};
        return {
          month: revenueItem.month || '',
          date: revenueItem.month || '',
          revenue: revenueItem.revenue || 0,
          orders: orderItem.orders || 0
        };
      });
      
      setSalesChartData(combinedSalesData);

      // Set recent orders with validation
      setRecentOrders(Array.isArray(data.recent_orders) ? data.recent_orders : []);

      // Set low stock products with validation
      setLowStockProducts(Array.isArray(data.low_stock_products) ? data.low_stock_products : []);

      // Process payment stats
      const paymentMethods = data.payment_methods || [];
      const totalPaymentCount = paymentMethods.reduce((sum, item) => sum + (item.count || 0), 0);
      const transformedPaymentStats = paymentMethods.map(item => ({
        payment_method: item.method || '',
        count: item.count || 0,
        revenue: item.revenue || 0,
        percentage: totalPaymentCount > 0 ? Math.round((item.count / totalPaymentCount) * 100) : 0
      }));
      setPaymentStats(transformedPaymentStats);

      // Set product performance
      const topProducts = data.top_products || [];
      const transformedProductPerformance = topProducts.map(item => ({
        product_name: item.product_name || '',
        total_revenue: item.revenue || 0,
        quantity_sold: item.quantity_sold || 0,
        sku: item.sku || ''
      }));
      setProductPerformance(transformedProductPerformance);

      // Set monthly trend
      setMonthlyTrend(data.monthly_orders || []);

      // Set vendor performance with validation
      const vendorData = data.vendor_performance || [];
      setVendorPerformance(Array.isArray(vendorData) ? vendorData : []);

    } catch (err) {
      console.error('Dashboard API Error:', err);
      let errorMessage = 'Failed to load dashboard data';
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 401) {
          errorMessage = 'Authentication required. Please login.';
        } else if (status === 403) {
          errorMessage = 'Access denied. Admin privileges required.';
        } else if (status === 404) {
          errorMessage = 'Dashboard API endpoint not found.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = data?.error || `Error ${status}: ${err.response.statusText}`;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err.message || 'Unexpected error occurred';
      }
      
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    message.success('Dashboard data refreshed successfully');
  };

  // Enhanced StatCard component with theme support
  const StatCard = ({ 
    title, 
    value, 
    prefix, 
    suffix, 
    growth, 
    icon, 
    gradient, 
    size = "default",
    insight,
    subtitle,
    extra 
  }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
      if (value) {
        const numericValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
        let startValue = 0;
        const increment = numericValue / 60;
        const timer = setInterval(() => {
          startValue += increment;
          if (startValue >= numericValue) {
            setAnimatedValue(numericValue);
            clearInterval(timer);
          } else {
            setAnimatedValue(Math.floor(startValue));
          }
        }, 25);
        return () => clearInterval(timer);
      }
    }, [value]);

    return (
      <Card 
        className="enhanced-stat-card"
        bodyStyle={{ 
          padding: 0,
          background: gradient,
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '170px'
        }}
        style={{
          boxShadow: currentTheme === 'dark' 
            ? '0 12px 35px rgba(0,0,0,0.4)' 
            : '0 12px 35px rgba(0,0,0,0.18)',
          border: `2px solid ${chartColors.cardBorder}`,
          transition: 'all 0.3s ease',
          background: gradient,
          minHeight: '170px',
          height: '100%'
        }}
        hoverable
      >
        <div style={{ padding: '24px', position: 'relative', zIndex: 2 }}>
          <Row justify="space-between" align="top">
            <Col span={16}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text 
                  style={{ 
                    color: 'white', 
                    fontSize: '13px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    lineHeight: 1.2
                  }}
                >
                  {title}
                </Text>
                <div style={{ 
                  fontSize: size === "large" ? '30px' : '26px', 
                  fontWeight: 'bold',
                  color: 'white',
                  lineHeight: 1,
                  textShadow: '0 3px 6px rgba(0,0,0,0.4)',
                  marginTop: '4px',
                  marginBottom: '6px'
                }}>
                  {prefix}{typeof animatedValue === 'number' ? animatedValue.toLocaleString() : animatedValue}{suffix}
                </div>
                {subtitle && (
                  <Text style={{ 
                    color: 'white', 
                    fontSize: '11px', 
                    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    lineHeight: 1.3,
                    fontWeight: '500'
                  }}>
                    {subtitle}
                  </Text>
                )}
                {growth !== undefined && (
                  <div style={{ 
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: 'rgba(0,0,0,0.6)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backdropFilter: 'blur(8px)',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    {formatInsight(growth)}
                    <Text style={{ 
                      color: 'rgba(255,255,255,1)', 
                      fontSize: '11px',
                      textShadow: '0 2px 6px rgba(0,0,0,0.8)',
                      fontWeight: '700',
                      lineHeight: 1
                    }}>
                      vs last period
                    </Text>
                  </div>
                )}
              </Space>
            </Col>
            <Col span={8} style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
              <Avatar 
                size={size === "large" ? 56 : 48} 
                icon={icon} 
                style={{ 
                  background: 'rgba(0,0,0,0.25)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(5px)'
                }} 
              />
              {extra && (
                <div style={{ 
                  marginTop: '8px', 
                  color: 'white', 
                  textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                  fontSize: '12px'
                }}>
                  {extra}
                </div>
              )}
            </Col>
          </Row>
        </div>
        {/* Decorative background elements */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          zIndex: 1
        }} />
      </Card>
    );
  };

  // Format currency
  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || 0}`;

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Recent orders table columns
  const orderColumns = [
    {
      title: 'Order #',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (text) => <Text strong>#{text}</Text>
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (name) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <Text>{name || 'Walk-in Customer'}</Text>
        </Space>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => <Text strong>{formatCurrency(amount)}</Text>
    },
    {
      title: 'Payment',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method) => {
        const colors = {
          'UPI': 'blue',
          'Cash': 'green',
          'Card': 'orange',
          'card': 'orange',
          'cash': 'green',
          'upi': 'blue'
        };
        return <Tag color={colors[method] || 'default'}>{method?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Items',
      dataIndex: 'items_count',
      key: 'items_count',
      render: (count) => <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => <Text type="secondary">{formatDate(date)}</Text>
    }
  ];

  // Loading state
  if (loading) {
    return (
      <div className={`modern-dashboard ${currentTheme === 'dark' ? 'dark-theme' : ''}`}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          background: currentTheme === 'dark' ? '#111827' : 'transparent'
        }}>
          <Spin size="large" tip="Loading dashboard..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`modern-dashboard ${currentTheme === 'dark' ? 'dark-theme' : ''}`} style={{
        background: currentTheme === 'dark' ? '#111827' : 'transparent',
        minHeight: '100vh',
        padding: '24px'
      }}>
        <Alert
          message="Dashboard Error"
          description={
            <div>
              <p>{error}</p>
              <Button 
                type="primary" 
                icon={<SyncOutlined />}
                onClick={fetchDashboardData}
                style={{ marginTop: '12px' }}
              >
                Retry
              </Button>
            </div>
          }
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: '24px' }}
        />
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .dark-theme .enhanced-chart-card {
            background: ${chartColors.cardBg} !important;
            border-color: ${chartColors.cardBorder} !important;
          }
          
          .dark-theme .enhanced-chart-card .ant-card-head {
            background: ${chartColors.cardBg} !important;
            border-bottom-color: ${chartColors.cardBorder} !important;
          }
          
          .dark-theme .enhanced-chart-card .ant-card-head-title {
            color: ${chartColors.textPrimary} !important;
          }
          
          .dark-theme .dashboard-header {
            background: ${chartColors.cardBg} !important;
            border-color: ${chartColors.cardBorder} !important;
          }
        `}
      </style>
      <div className={`enhanced-dashboard ${currentTheme === 'dark' ? 'dark-theme' : ''}`} style={{ 
        background: currentTheme === 'dark' ? '#111827' : 'transparent',
        minHeight: '100vh',
        padding: '24px'
      }}>
      {/* Enhanced Header with Controls */}
      <div className="dashboard-header" style={{
        background: chartColors.cardBg,
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: currentTheme === 'dark' 
          ? '0 4px 20px rgba(0,0,0,0.3)' 
          : '0 4px 20px rgba(0,0,0,0.06)',
        border: `1px solid ${chartColors.cardBorder}`
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size="small">
              <Title level={2} style={{ margin: 0, color: chartColors.textPrimary }}>
                <DollarOutlined style={{ marginRight: '12px', color: chartColors.primary }} />
                Business Dashboard
              </Title>
              <Text style={{ color: chartColors.textSecondary, fontSize: '16px' }}>
                Real-time insights and analytics for your business
              </Text>
            </Space>
          </Col>
          <Col>
            <Space size="middle">
              <Select
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                style={{ width: 120 }}
                options={[
                  { label: '7 Days', value: '7' },
                  { label: '30 Days', value: '30' },
                  { label: '90 Days', value: '90' }
                ]}
              />
              <Segmented
                options={[
                  { label: 'Area', value: 'area', icon: <AreaChartOutlined /> },
                  { label: 'Line', value: 'line', icon: <LineChartOutlined /> },
                  { label: 'Bar', value: 'bar', icon: <BarChartOutlined /> }
                ]}
                value={chartType}
                onChange={setChartType}
              />
              <Button 
                type="primary"
                icon={refreshing ? <SyncOutlined spin /> : <SyncOutlined />}
                onClick={handleRefresh}
                loading={refreshing}
                style={{ borderRadius: '8px' }}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Enhanced Key Metrics with Better Spacing */}
      <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Revenue"
            value={dashboardData?.total_revenue || 0}
            prefix="₹"
            growth={dashboardData?.revenue_growth}
            icon={<DollarOutlined />}
            gradient={chartColors.gradient1}
            subtitle={`${dashboardData?.revenue_growth > 0 ? '+' : ''}${dashboardData?.revenue_growth?.toFixed(1) || 0}% vs last month`}
            size="default"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Orders"
            value={dashboardData?.total_orders || 0}
            growth={dashboardData?.orders_growth}
            icon={<ShoppingCartOutlined />}
            gradient={chartColors.gradient2}
            subtitle={`${dashboardData?.orders_growth > 0 ? '+' : ''}${dashboardData?.orders_growth?.toFixed(1) || 0}% vs last month`}
            size="default"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Products"
            value={dashboardData?.total_products || 0}
            suffix=" SKUs"
            growth={dashboardData?.products_growth || 0}
            icon={<AppstoreOutlined />}
            gradient={chartColors.gradient3}
            subtitle={`+${dashboardData?.new_products_this_month || 0} new products this month`}
            size="default"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Inventory Value"
            value={dashboardData?.total_inventory_value || 0}
            prefix="₹"
            growth={dashboardData?.inventory_growth || 0}
            icon={<StockOutlined />}
            gradient={chartColors.gradient4}
            subtitle={`${dashboardData?.inventory_turnover || 0}x turnover ratio this quarter`}
            size="default"
          />
        </Col>
      </Row>

      {/* Enhanced Charts Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} xl={16}>
          <Card 
            title={
              <Space>
                <LineChartOutlined style={{ color: chartColors.primary }} />
                Sales Performance Trend
                <Tag color="blue">{selectedPeriod} days</Tag>
              </Space>
            }
            className="enhanced-chart-card"
            extra={
              <Space>
                <Tooltip title="Total revenue and orders over time">
                  <InfoCircleOutlined style={{ color: chartColors.textSecondary }} />
                </Tooltip>
              </Space>
            }
            bodyStyle={{ padding: '20px' }}
            style={{
              borderRadius: '16px',
              boxShadow: currentTheme === 'dark' 
                ? '0 8px 30px rgba(0,0,0,0.3)' 
                : '0 8px 30px rgba(0,0,0,0.08)',
              border: `2px solid ${chartColors.primary}30`,
              background: chartColors.cardBg,
              backdropFilter: 'blur(10px)'
            }}
          >
            <ResponsiveContainer width="100%" height={380}>
              {chartType === 'area' ? (
                <AreaChart data={salesChartData || []}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                      <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.success} stopOpacity={0.8}/>
                      <stop offset="100%" stopColor={chartColors.success} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.chartGrid} />
                  <XAxis 
                    dataKey="date" 
                    stroke={chartColors.textSecondary}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value ? value.replace(' 2025', '') : ''}
                  />
                  <YAxis 
                    stroke={chartColors.textSecondary} 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      background: currentTheme === 'dark' ? '#1f2937' : 'white', 
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                      color: chartColors.textPrimary
                    }}
                    labelFormatter={(value) => `Month: ${value}`}
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={chartColors.primary} 
                    fill="url(#revenueGradient)" 
                    strokeWidth={3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="orders" 
                    stroke={chartColors.success} 
                    fill="url(#ordersGradient)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              ) : chartType === 'line' ? (
                <LineChart data={salesChartData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.chartGrid} />
                  <XAxis 
                    dataKey="date" 
                    stroke={chartColors.textSecondary}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value ? value.replace(' 2025', '') : ''}
                  />
                  <YAxis 
                    stroke={chartColors.textSecondary} 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      background: currentTheme === 'dark' ? '#1f2937' : 'white',
                      color: chartColors.textPrimary,
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                    }}
                    labelFormatter={(value) => `Month: ${value}`}
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={chartColors.primary} 
                    strokeWidth={3}
                    dot={{ fill: chartColors.primary, strokeWidth: 2, r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke={chartColors.success} 
                    strokeWidth={3}
                    dot={{ fill: chartColors.success, strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={salesChartData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.chartGrid} />
                  <XAxis 
                    dataKey="date" 
                    stroke={chartColors.textSecondary}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value ? value.replace(' 2025', '') : ''}
                  />
                  <YAxis 
                    stroke={chartColors.textSecondary} 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      background: currentTheme === 'dark' ? '#1f2937' : 'white',
                      color: chartColors.textPrimary,
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                    }}
                    labelFormatter={(value) => `Month: ${value}`}
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill={chartColors.primary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} xl={8}>
          <Card 
            title={
              <Space>
                <PieChartOutlined style={{ color: chartColors.info }} />
                Payment Methods
              </Space>
            }
            className="enhanced-chart-card"
            bodyStyle={{ padding: '20px' }}
            style={{
              borderRadius: '16px',
              boxShadow: currentTheme === 'dark' 
                ? '0 8px 30px rgba(0,0,0,0.3)' 
                : '0 8px 30px rgba(0,0,0,0.08)',
              border: `2px solid ${chartColors.error}30`,
              background: chartColors.cardBg,
              backdropFilter: 'blur(10px)'
            }}
          >
            {paymentStats && paymentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    data={paymentStats || []}
                    dataKey="percentage"
                    nameKey="payment_method"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={140}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {(paymentStats || []).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={[
                          chartColors.primary, 
                          chartColors.warning, 
                          chartColors.success, 
                          chartColors.info,
                          chartColors.error,
                          chartColors.purple
                        ][index % 6]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      background: currentTheme === 'dark' ? '#1f2937' : 'white',
                      color: chartColors.textPrimary,
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                    }}
                    formatter={(value, name) => [`${value}%`, name.toUpperCase()]}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px', color: chartColors.textPrimary }}
                    formatter={(value) => (
                      <span style={{ 
                        textTransform: 'uppercase', 
                        fontWeight: 500, 
                        color: chartColors.textPrimary 
                      }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ 
                height: '380px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Empty 
                  description={
                    <Text style={{ color: chartColors.textSecondary }}>
                      No payment method data available
                    </Text>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Enhanced Analytics Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} xl={14}>
          <Card 
            title={
              <Space>
                <TrophyOutlined style={{ color: chartColors.success }} />
                Top Performing Products
                <Tag color="green">Revenue Based</Tag>
              </Space>
            }
            className="enhanced-chart-card"
            extra={
              <Space>
                <Text style={{ color: chartColors.textSecondary }}>Top 10 Products</Text>
              </Space>
            }
            bodyStyle={{ padding: '20px' }}
            style={{
              borderRadius: '16px',
              boxShadow: currentTheme === 'dark' 
                ? '0 8px 30px rgba(0,0,0,0.3)' 
                : '0 8px 30px rgba(0,0,0,0.08)',
              border: `2px solid ${chartColors.success}30`,
              background: chartColors.cardBg,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {(productPerformance || []).length > 0 ? (productPerformance || []).map((product, index) => {
                const maxRevenue = Math.max(...(productPerformance || []).map(p => p.total_revenue || 0));
                const percentage = maxRevenue > 0 ? Math.round((product.total_revenue / maxRevenue) * 100) : 0;
                
                return (
                  <div 
                    key={index} 
                    style={{ 
                      marginBottom: '20px',
                      padding: '16px',
                      background: currentTheme === 'dark' 
                        ? 'linear-gradient(135deg, #1f2937 0%, #374151 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      border: `1px solid ${chartColors.cardBorder}`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = currentTheme === 'dark' 
                        ? '0 8px 25px rgba(0,0,0,0.4)' 
                        : '0 8px 25px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Row justify="space-between" align="middle" style={{ marginBottom: '12px' }}>
                      <Col>
                        <Space>
                          <div 
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${chartColors.success} 0%, ${chartColors.info} 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <Text 
                              strong 
                              style={{ 
                                fontSize: '15px',
                                display: 'block',
                                marginBottom: '2px',
                                color: chartColors.textPrimary
                              }}
                            >
                              {product.product_name}
                            </Text>
                            <Text 
                              type="secondary" 
                              style={{ fontSize: '12px' }}
                            >
                              {product.quantity_sold} units sold
                            </Text>
                          </div>
                        </Space>
                      </Col>
                      <Col>
                        <Text 
                          strong 
                          style={{ 
                            fontSize: '16px',
                            color: chartColors.success
                          }}
                        >
                          ₹{(product.total_revenue || 0).toLocaleString()}
                        </Text>
                      </Col>
                    </Row>
                    
                    {/* Revenue Progress Bar */}
                    <div style={{ marginBottom: '8px' }}>
                      <Row justify="space-between" align="middle" style={{ marginBottom: '6px' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          Revenue Progress
                        </Text>
                        <Text 
                          strong 
                          style={{ 
                            fontSize: '11px',
                            color: chartColors.info
                          }}
                        >
                          {percentage}%
                        </Text>
                      </Row>
                      <div 
                        style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: currentTheme === 'dark' ? '#374151' : '#e2e8f0',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                      >
                        <div 
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${chartColors.success} 0%, ${chartColors.info} 100%)`,
                            borderRadius: '4px',
                            transition: 'width 0.8s ease-in-out',
                            position: 'relative'
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                              animation: percentage > 0 ? 'shimmer 2s infinite' : 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Empty 
                    description={
                      <Text style={{ color: chartColors.textSecondary }}>
                        No product performance data available
                      </Text>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              )}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} xl={10}>
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined style={{ color: chartColors.info }} />
                Recent Orders
                <Badge count={recentOrders?.length || 0} style={{ backgroundColor: chartColors.info }} />
              </Space>
            }
            className="enhanced-chart-card"
            bodyStyle={{ padding: '16px', maxHeight: '448px', overflowY: 'auto' }}
            style={{
              borderRadius: '16px',
              boxShadow: currentTheme === 'dark' 
                ? '0 8px 30px rgba(0,0,0,0.3)' 
                : '0 8px 30px rgba(0,0,0,0.08)',
              border: `2px solid ${chartColors.info}30`,
              background: chartColors.cardBg,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {(recentOrders || []).length > 0 ? (recentOrders || []).map((order, index) => (
                <Card 
                  key={order.id || index}
                  size="small"
                  style={{ 
                    background: currentTheme === 'dark' 
                      ? 'linear-gradient(135deg, #1f2937 0%, #374151 100%)'
                      : 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
                    border: `2px solid ${chartColors.cardBorder}`,
                    borderRadius: '12px',
                    transition: 'all 0.3s ease'
                  }}
                  bodyStyle={{ padding: '16px' }}
                  hoverable
                >
                  <Row justify="space-between" align="middle">
                    <Col span={16}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                          <Avatar 
                            icon={<UserOutlined />} 
                            size="small"
                            style={{ backgroundColor: chartColors.primary }}
                          />
                          <Text strong style={{ fontSize: '14px', color: chartColors.textPrimary }}>
                            {order.customer_name || 'Walk-in Customer'}
                          </Text>
                        </Space>
                        <Space split={<Text type="secondary">•</Text>} wrap>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            #{order.order_number?.slice(0, 8)}...
                          </Text>
                          <Tag 
                            color={
                              order.payment_method?.toLowerCase() === 'upi' ? 'blue' : 
                              order.payment_method?.toLowerCase() === 'cash' ? 'green' : 'orange'
                            }
                            style={{ fontSize: '10px', padding: '2px 8px' }}
                          >
                            {order.payment_method?.toUpperCase()}
                          </Tag>
                          <Badge 
                            count={order.items_count} 
                            style={{ backgroundColor: chartColors.success, fontSize: '10px' }} 
                          />
                        </Space>
                      </Space>
                    </Col>
                    <Col span={8} style={{ textAlign: 'right' }}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong style={{ fontSize: '15px', color: chartColors.success }}>
                          {formatCurrency(order.total_amount)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {formatDate(order.created_at)}
                        </Text>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              )) : (
                <Empty 
                  description={
                    <Text style={{ color: chartColors.textSecondary }}>
                      No recent orders
                    </Text>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Enhanced Metrics and Alerts */}
      <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Avg Order Value"
            value={dashboardData?.avg_order_value || 0}
            prefix="₹"
            icon={<FireOutlined />}
            gradient={chartColors.gradient5}
            subtitle="Per transaction"
            size="default"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Items Sold"
            value={dashboardData?.items_sold?.last_30_days || 0}
            icon={<GiftOutlined />}
            gradient={chartColors.gradient1}
            subtitle="Last 30 days"
            size="default"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Low Stock Alert"
            value={dashboardData?.products?.low_stock || 0}
            suffix=" Items"
            icon={<WarningOutlined />}
            gradient="linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
            subtitle="Need immediate restocking"
            size="default"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Out of Stock"
            value={dashboardData?.products?.out_of_stock || 0}
            suffix=" Products"
            icon={<StockOutlined />}
            gradient="linear-gradient(135deg, #e55039 0%, #c44569 100%)"
            subtitle="Immediate attention needed"
            size="default"
          />
        </Col>
      </Row>

      {/* Enhanced Low Stock Products Alert */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <Row style={{ marginTop: '32px' }}>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <WarningOutlined style={{ color: chartColors.warning }} />
                  Inventory Alerts & Action Required
                  <Badge count={lowStockProducts.length} style={{ backgroundColor: chartColors.error }} />
                </Space>
              }
              className="enhanced-chart-card"
              bodyStyle={{ padding: '20px' }}
              style={{
                borderRadius: '16px',
                boxShadow: currentTheme === 'dark' 
                  ? `0 8px 30px ${chartColors.warning}30` 
                  : `0 8px 30px ${chartColors.warning}15`,
                border: `2px solid ${chartColors.warning}50`,
                background: chartColors.cardBg,
                backdropFilter: 'blur(10px)'
              }}
            >
              <Row gutter={[16, 16]}>
                {lowStockProducts.map((item, index) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={index}>
                    <Card 
                      size="small"
                      style={{ 
                        background: item.stock_count === 0 
                          ? (currentTheme === 'dark' 
                              ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)'
                              : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)')
                          : (currentTheme === 'dark' 
                              ? 'linear-gradient(135deg, #78350f 0%, #92400e 100%)'
                              : 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)'),
                        border: `2px solid ${item.stock_count === 0 ? chartColors.error : chartColors.warning}60`,
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        height: '160px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      bodyStyle={{ 
                        padding: '16px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                      hoverable
                    >
                      <div>
                        <Row justify="space-between" align="top" style={{ marginBottom: '8px' }}>
                          <Col span={16}>
                            <Space>
                              <Avatar 
                                icon={<AppstoreOutlined />} 
                                size={32}
                                style={{ 
                                  backgroundColor: item.stock_count === 0 ? chartColors.error : chartColors.warning,
                                  color: 'white'
                                }}
                              />
                              <div>
                                <Text 
                                  strong 
                                  style={{ 
                                    fontSize: '13px', 
                                    display: 'block',
                                    lineHeight: '1.2',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '120px',
                                    color: currentTheme === 'dark' ? '#f9fafb' : '#1f2937'
                                  }}
                                  title={item.product_name}
                                >
                                  {item.product_name}
                                </Text>
                                <Text 
                                  type="secondary" 
                                  style={{ 
                                    fontSize: '11px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'block',
                                    maxWidth: '120px'
                                  }}
                                  title={item.vendor_name}
                                >
                                  {item.vendor_name}
                                </Text>
                              </div>
                            </Space>
                          </Col>
                          <Col span={8} style={{ textAlign: 'right' }}>
                            <Tag 
                              color={item.stock_count === 0 ? 'red' : 'orange'}
                              style={{ 
                                fontSize: '9px', 
                                padding: '2px 6px',
                                borderRadius: '6px',
                                fontWeight: 'bold'
                              }}
                            >
                              {item.stock_count === 0 ? 'OUT' : 'LOW'}
                            </Tag>
                          </Col>
                        </Row>
                      </div>
                      
                      <div style={{ marginTop: 'auto' }}>
                        <Divider style={{ margin: '8px 0 12px 0' }} />
                        
                        <Row justify="space-between" align="bottom">
                          <Col>
                            <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>SKU</Text>
                            <Text 
                              strong 
                              style={{ 
                                fontSize: '11px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                                maxWidth: '60px',
                                color: currentTheme === 'dark' ? '#f9fafb' : '#1f2937'
                              }}
                              title={item.sku}
                            >
                              {item.sku}
                            </Text>
                          </Col>
                          <Col style={{ textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>Stock</Text>
                            <Text 
                              strong 
                              style={{ 
                                fontSize: '14px',
                                color: item.stock_count === 0 ? chartColors.error : chartColors.warning
                              }}
                            >
                              {item.stock_count}
                            </Text>
                          </Col>
                          <Col style={{ textAlign: 'right' }}>
                            <Button 
                              type={item.stock_count === 0 ? "primary" : "default"}
                              size="small"
                              danger={item.stock_count === 0}
                              style={{ 
                                fontSize: '10px',
                                height: '24px',
                                borderRadius: '6px'
                              }}
                            >
                              {item.stock_count === 0 ? 'Restock' : 'Add'}
                            </Button>
                          </Col>
                        </Row>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* Enhanced Vendor Performance Comparison */}
      {vendorPerformance && vendorPerformance.length > 0 && (
        <Row style={{ marginTop: '32px' }}>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <TeamOutlined style={{ color: chartColors.info }} />
                  Vendor Performance Comparison
                  <Tag color="blue">Top Vendors</Tag>
                </Space>
              }
              className="enhanced-chart-card"
              extra={
                <Space>
                  <Select
                    value={vendorMetric}
                    onChange={setVendorMetric}
                    style={{ width: 140 }}
                    options={[
                      { label: 'Revenue', value: 'revenue' },
                      { label: 'Product Count', value: 'products' },
                      { label: 'Order Volume', value: 'orders' }
                    ]}
                  />
                  <Text style={{ color: chartColors.textSecondary }}>Comparison Metrics</Text>
                </Space>
              }
              bodyStyle={{ padding: '20px' }}
              style={{
                borderRadius: '16px',
                boxShadow: currentTheme === 'dark' 
                  ? '0 8px 30px rgba(0,0,0,0.3)' 
                  : '0 8px 30px rgba(0,0,0,0.08)',
                border: `2px solid ${chartColors.info}30`,
                background: chartColors.cardBg,
                backdropFilter: 'blur(10px)'
              }}
            >
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={vendorPerformance || []}>
                  <defs>
                    <linearGradient id="vendorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                      <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="vendorSecondaryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.success} stopOpacity={0.8}/>
                      <stop offset="100%" stopColor={chartColors.success} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.chartGrid} />
                  <XAxis 
                    dataKey="vendor_name" 
                    stroke={chartColors.textSecondary}
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke={chartColors.textSecondary} 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => 
                      vendorMetric === 'revenue' ? `₹${(value/1000).toFixed(0)}K` : value
                    }
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke={chartColors.textSecondary} 
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      background: currentTheme === 'dark' ? '#1f2937' : 'white',
                      color: chartColors.textPrimary,
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                    }}
                    labelFormatter={(value) => `Vendor: ${value}`}
                    formatter={(value, name) => {
                      if (name === 'total_revenue') return [`₹${value?.toLocaleString() || 0}`, 'Revenue'];
                      if (name === 'product_count') return [value || 0, 'Products'];
                      if (name === 'order_count') return [value || 0, 'Orders'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  
                  {/* Primary metric based on selection */}
                  {vendorMetric === 'revenue' && (
                    <>
                      <Bar 
                        yAxisId="left"
                        dataKey="total_revenue" 
                        fill="url(#vendorGradient)"
                        radius={[4, 4, 0, 0]}
                        name="Revenue"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="product_count" 
                        stroke={chartColors.success}
                        strokeWidth={3}
                        dot={{ fill: chartColors.success, strokeWidth: 2, r: 5 }}
                        name="Products"
                      />
                    </>
                  )}
                  
                  {vendorMetric === 'products' && (
                    <>
                      <Bar 
                        yAxisId="left"
                        dataKey="product_count" 
                        fill="url(#vendorSecondaryGradient)"
                        radius={[4, 4, 0, 0]}
                        name="Products"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="total_revenue" 
                        stroke={chartColors.primary}
                        strokeWidth={3}
                        dot={{ fill: chartColors.primary, strokeWidth: 2, r: 5 }}
                        name="Revenue"
                      />
                    </>
                  )}
                  
                  {vendorMetric === 'orders' && (
                    <>
                      <Bar 
                        yAxisId="left"
                        dataKey="order_count" 
                        fill={chartColors.warning}
                        radius={[4, 4, 0, 0]}
                        name="Orders"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="total_revenue" 
                        stroke={chartColors.primary}
                        strokeWidth={3}
                        dot={{ fill: chartColors.primary, strokeWidth: 2, r: 5 }}
                        name="Revenue"
                      />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
              
              {/* Vendor Performance Summary Cards */}
              <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                {vendorPerformance.slice(0, 4).map((vendor, index) => (
                  <Col xs={24} sm={12} lg={6} key={vendor.vendor_id || index}>
                    <Card 
                      size="small"
                      style={{ 
                        background: currentTheme === 'dark'
                          ? (index === 0 ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' :
                             index === 1 ? 'linear-gradient(135deg, #166534 0%, #15803d 100%)' :
                             index === 2 ? 'linear-gradient(135deg, #a16207 0%, #ca8a04 100%)' :
                             'linear-gradient(135deg, #be185d 0%, #db2777 100%)')
                          : (index === 0 ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' :
                             index === 1 ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' :
                             index === 2 ? 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)' :
                             'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)'),
                        border: `2px solid ${
                          index === 0 ? chartColors.info + '40' :
                          index === 1 ? chartColors.success + '40' :
                          index === 2 ? chartColors.warning + '40' :
                          chartColors.rose + '40'
                        }`,
                        borderRadius: '12px',
                        transition: 'all 0.3s ease'
                      }}
                      bodyStyle={{ padding: '16px' }}
                      hoverable
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Avatar 
                            style={{ 
                              backgroundColor: index === 0 ? chartColors.info :
                                             index === 1 ? chartColors.success :
                                             index === 2 ? chartColors.warning :
                                             chartColors.rose,
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                            size="small"
                          >
                            {index + 1}
                          </Avatar>
                          <Tag 
                            color={
                              index === 0 ? 'blue' :
                              index === 1 ? 'green' :
                              index === 2 ? 'orange' : 'pink'
                            }
                            style={{ fontSize: '10px' }}
                          >
                            {index === 0 ? 'TOP' : index === 1 ? '2ND' : index === 2 ? '3RD' : '4TH'}
                          </Tag>
                        </div>
                        
                        <Text 
                          strong 
                          style={{ 
                            fontSize: '13px',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: currentTheme === 'dark' ? '#f9fafb' : '#1f2937'
                          }}
                          title={vendor.vendor_name}
                        >
                          {vendor.vendor_name}
                        </Text>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>Revenue</Text>
                            <Text strong style={{ 
                              fontSize: '12px', 
                              color: currentTheme === 'dark' ? chartColors.success : chartColors.success 
                            }}>
                              ₹{(vendor.total_revenue || 0).toLocaleString()}
                            </Text>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>Products</Text>
                            <Text strong style={{ 
                              fontSize: '12px',
                              color: currentTheme === 'dark' ? '#f9fafb' : '#1f2937'
                            }}>
                              {vendor.product_count || 0}
                            </Text>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>Orders</Text>
                            <Text strong style={{ 
                              fontSize: '12px', 
                              color: currentTheme === 'dark' ? chartColors.info : chartColors.info 
                            }}>
                              {vendor.order_count || 0}
                            </Text>
                          </div>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
    </>
  );
};

export default Dashboard;