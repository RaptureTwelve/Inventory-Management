import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Avatar,
  Tag,
  Progress,
  Spin,
  Alert,
  Badge,
  Table,
  Tooltip,
  Button,
  Empty,
  Divider,
  Tabs,
  List
} from 'antd';
import {
  ShoppingCartOutlined,
  GiftOutlined ,
  RiseOutlined,
  BarChartOutlined,
  StarOutlined,
  DatabaseOutlined,
  CalendarOutlined,
  RocketOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SyncOutlined
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { useParams } from 'react-router-dom';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const VendorAnalyticsDashboard = () => {
    const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced color palette with CSS variables
  const chartColors = {
    primary: 'var(--primary-color)',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',
    purple: '#722ed1',
    cyan: '#13c2c2',
    orange: '#fa8c16',
    geekblue: '#2f54eb',
    magenta: '#eb2f96'
  };

  useEffect(() => {
    if (id) {
      fetchAnalyticsData();
    }
  }, [id]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/vendors/${id}/analytics/`);
      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Analytics API Error:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  // Enhanced StatCard component
  const StatCard = ({ 
    title, 
    value, 
    prefix, 
    suffix, 
    icon, 
    color, 
    trend,
    trendValue,
    subtitle 
  }) => {
    return (
      <Card 
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          height: '100%'
        }}
        bodyStyle={{ padding: '24px' }}
        hoverable
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Text style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '14px',
              fontWeight: '500',
              display: 'block',
              marginBottom: '8px'
            }}>
              {title}
            </Text>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: 'bold',
              color: 'var(--text-color)',
              lineHeight: '1.2',
              marginBottom: '4px'
            }}>
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </div>
            {subtitle && (
              <Text style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '12px'
              }}>
                {subtitle}
              </Text>
            )}
            {trend && (
              <div style={{ marginTop: '8px' }}>
                <Space>
                  {trend === 'up' ? 
                    <ArrowUpOutlined style={{ color: chartColors.success }} /> : 
                    <ArrowDownOutlined style={{ color: chartColors.error }} />
                  }
                  <Text style={{ 
                    color: trend === 'up' ? chartColors.success : chartColors.error,
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {trendValue}% vs last month
                  </Text>
                </Space>
              </div>
            )}
          </div>
          <Avatar 
            size={48} 
            icon={icon} 
            style={{ 
              backgroundColor: color,
              color: 'white'
            }} 
          />
        </div>
      </Card>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        background: 'var(--bg-color)'
      }}>
        <Spin size="large" tip="Loading vendor analytics..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '24px', background: 'var(--bg-color)', minHeight: '60vh' }}>
        <Alert
          message="Analytics Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={fetchAnalyticsData}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div style={{ padding: '24px', background: 'var(--bg-color)' }}>
        <Empty description="No analytics data available" />
      </div>
    );
  }

  // Prepare chart data
  const topBatchesChartData = analyticsData.top_batches_this_month?.map(batch => ({
    name: `Batch ${batch.batch_number}`,
    sold: batch.sold,
    batch_id: batch.batch_id
  })) || [];

  const topProductsChartData = analyticsData.top_products_this_month?.map(product => ({
    name: product.product_type,
    sold: product.sold,
    product_id: product.product_id
  })) || [];

  // Product stock overview for pie chart
  const stockOverviewData = analyticsData.product_stock_details?.map((product, index) => ({
    name: product.product_type,
    value: product.total_available,
    color: [chartColors.primary, chartColors.success, chartColors.warning, chartColors.info, chartColors.purple][index % 5]
  })) || [];

  // Batch performance table columns
  const batchColumns = [
    {
      title: '#',
      dataIndex: 'rank',
      key: 'rank',
      width: 50,
      render: (_, __, index) => (
        <Badge 
          count={index + 1} 
          style={{ 
            backgroundColor: index < 3 ? chartColors.warning : chartColors.primary 
          }} 
        />
      )
    },
    {
      title: 'Batch Number',
      dataIndex: 'batch_number',
      key: 'batch_number',
      render: (text) => <Text strong>#{text}</Text>
    },
    {
      title: 'Units Sold',
      dataIndex: 'sold',
      key: 'sold',
      render: (value) => (
        <Tag color="green">
          <RiseOutlined /> {value}
        </Tag>
      )
    }
  ];

  // Product performance table columns
  const productColumns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (_, __, index) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {index < 3 && <TrophyOutlined style={{ color: chartColors.warning, marginRight: '4px' }} />}
          <Text strong>{index + 1}</Text>
        </div>
      )
    },
    {
      title: 'Product Type',
      dataIndex: 'product_type',
      key: 'product_type',
      render: (text) => <Text strong style={{ color: 'var(--text-color)' }}>{text}</Text>
    },
    {
      title: 'Units Sold',
      dataIndex: 'sold',
      key: 'sold',
      render: (value) => (
        <Statistic 
          value={value} 
          valueStyle={{ fontSize: '16px', color: chartColors.success }}
          prefix={<RocketOutlined />}
        />
      )
    }
  ];

  return (
    <div style={{ 
      padding: '24px', 
      background: 'var(--bg-color)', 
      minHeight: '100vh',
      color: 'var(--text-color)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, color: 'var(--text-color)' }}>
              <DatabaseOutlined style={{ marginRight: '12px', color: 'var(--primary-color)' }} />
              {analyticsData.vendor_name} Analytics
            </Title>
            <Text style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              Comprehensive vendor performance and stock analytics
            </Text>
          </div>
          <Button 
            type="primary"
            icon={refreshing ? <SyncOutlined spin /> : <SyncOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
            style={{ borderRadius: '8px' }}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Products"
            value={analyticsData.total_products}
            icon={<GiftOutlined  />}
            color={chartColors.primary}
            subtitle="Active product lines"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Available Stock"
            value={analyticsData.total_stock}
            suffix=" units"
            icon={<DatabaseOutlined />}
            color={chartColors.success}
            subtitle="Ready for sale"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="This Month Sold"
            value={analyticsData.month_sold_stock}
            suffix=" units"
            icon={<RiseOutlined />}
            color={chartColors.warning}
            subtitle="Current month performance"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Stock Turnover"
            value={analyticsData.total_stock > 0 ? 
              ((analyticsData.month_sold_stock / analyticsData.total_stock) * 100).toFixed(1) : 0
            }
            suffix="%"
            icon={<BarChartOutlined />}
            color={chartColors.info}
            subtitle="Monthly turnover rate"
          />
        </Col>
      </Row>

      {/* Charts and Rankings */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {/* Top Batches Chart */}
        <Col xs={24} xl={12}>
          <Card 
            title={
              <Space>
                <StarOutlined style={{ color: chartColors.warning }} />
                Top Performing Batches This Month
                <Badge count={topBatchesChartData.length} style={{ backgroundColor: chartColors.warning }} />
              </Space>
            }
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px'
            }}
            bodyStyle={{ padding: '20px' }}
          >
            {topBatchesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topBatchesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-secondary)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    fontSize={12}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-color)'
                    }}
                  />
                  <Bar 
                    dataKey="sold" 
                    fill={chartColors.warning}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No batch sales data for this month" />
            )}
          </Card>
        </Col>

        {/* Top Products Chart */}
        <Col xs={24} xl={12}>
          <Card 
            title={
              <Space>
                <TrophyOutlined style={{ color: chartColors.success }} />
                Top Selling Products This Month
                <Badge count={topProductsChartData.length} style={{ backgroundColor: chartColors.success }} />
              </Space>
            }
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px'
            }}
            bodyStyle={{ padding: '20px' }}
          >
            {topProductsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={topProductsChartData}>
                  <defs>
                    <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={chartColors.success} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-secondary)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    fontSize={12}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-color)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sold" 
                    stroke={chartColors.success}
                    fillOpacity={1}
                    fill="url(#colorSold)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No product sales data for this month" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Detailed Analytics Tabs */}
      <Card 
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px'
        }}
      >
        <Tabs defaultActiveKey="1" size="large">
          {/* Batch Rankings */}
          <TabPane 
            tab={
              <Space>
                <StarOutlined />
                Batch Rankings
              </Space>
            } 
            key="1"
          >
            <Table
              dataSource={analyticsData.top_batches_this_month?.map((item, index) => ({ ...item, key: index }))}
              columns={batchColumns}
              pagination={false}
              size="middle"
              style={{ 
                backgroundColor: 'transparent'
              }}
            />
          </TabPane>

          {/* Product Rankings */}
          <TabPane 
            tab={
              <Space>
                <TrophyOutlined />
                Product Rankings
              </Space>
            } 
            key="2"
          >
            <Table
              dataSource={analyticsData.top_products_this_month?.map((item, index) => ({ ...item, key: index }))}
              columns={productColumns}
              pagination={false}
              size="middle"
            />
          </TabPane>

          {/* Stock Details */}
          <TabPane 
            tab={
              <Space>
                <DatabaseOutlined />
                Stock Details
              </Space>
            } 
            key="3"
          >
            <Row gutter={[24, 24]}>
              {/* Stock Distribution */}
              <Col xs={24} lg={12}>
                <Card 
                  title="Stock Distribution by Product"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {stockOverviewData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stockOverviewData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {stockOverviewData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: 'var(--text-color)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Empty description="No stock data available" />
                  )}
                </Card>
              </Col>

              {/* Detailed Product Stock */}
              <Col xs={24} lg={12}>
                <Card 
                  title="Product Stock Summary"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <List
                    dataSource={analyticsData.product_stock_details}
                    renderItem={(product, index) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              style={{ 
                                backgroundColor: stockOverviewData[index]?.color || chartColors.primary 
                              }}
                            >
                              {product.product_type.charAt(0)}
                            </Avatar>
                          }
                          title={
                            <Text strong style={{ color: 'var(--text-color)' }}>
                              {product.product_type}
                            </Text>
                          }
                          description={
                            <Space direction="vertical" size="small">
                              <Space>
                                <Text type="secondary">Added: {product.total_added}</Text>
                                <Divider type="vertical" />
                                <Text type="secondary">Sold: {product.total_sold}</Text>
                                <Divider type="vertical" />
                                <Text style={{ color: chartColors.success }}>
                                  Available: {product.total_available}
                                </Text>
                              </Space>
                              <Progress 
                                percent={product.total_added > 0 ? 
                                  ((product.total_sold / product.total_added) * 100).toFixed(1) : 0
                                }
                                size="small"
                                strokeColor={chartColors.success}
                                format={(percent) => `${percent}% sold`}
                              />
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Batch Details */}
          <TabPane 
            tab={
              <Space>
                <InfoCircleOutlined />
                Batch Details
              </Space>
            } 
            key="4"
          >
            {analyticsData.product_stock_details?.map((product, productIndex) => (
              <Card
                key={product.product_id}
                title={
                  <Space>
                    <GiftOutlined  style={{ color: chartColors.primary }} />
                    {product.product_type}
                    <Tag color="blue">{product.batches?.length || 0} batches</Tag>
                  </Space>
                }
                style={{
                  marginBottom: '16px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)'
                }}
                size="small"
              >
                <Row gutter={[16, 16]}>
                  {product.batches?.map((batch, batchIndex) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={batch.id}>
                      <Card
                        size="small"
                        style={{
                          background: 'var(--hover-bg)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px'
                        }}
                      >
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong style={{ color: 'var(--text-color)' }}>
                              Batch #{batch.batch_number}
                            </Text>
                            <Tag 
                              color={batch.available_qty > 10 ? 'green' : 
                                     batch.available_qty > 0 ? 'orange' : 'red'}
                            >
                              {batch.available_qty > 0 ? 'In Stock' : 'Out of Stock'}
                            </Tag>
                          </div>
                          
                          <div>
                            <Row>
                              <Col span={12}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Added</Text>
                                <div style={{ fontWeight: 'bold', color: chartColors.info }}>
                                  {batch.added_qty}
                                </div>
                              </Col>
                              <Col span={12}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Sold</Text>
                                <div style={{ fontWeight: 'bold', color: chartColors.warning }}>
                                  {batch.sold_qty}
                                </div>
                              </Col>
                            </Row>
                          </div>
                          
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>Available</Text>
                            <div style={{ 
                              fontWeight: 'bold', 
                              fontSize: '16px',
                              color: batch.available_qty > 0 ? chartColors.success : chartColors.error
                            }}>
                              {batch.available_qty}
                            </div>
                          </div>
                          
                          <Progress 
                            percent={batch.added_qty > 0 ? 
                              ((batch.sold_qty / batch.added_qty) * 100).toFixed(0) : 0
                            }
                            size="small"
                            strokeColor={chartColors.success}
                            showInfo={false}
                          />
                        </Space>
                      </Card>
                    </Col>
                  )) || (
                    <Col span={24}>
                      <Empty description="No batch data available for this product" />
                    </Col>
                  )}
                </Row>
              </Card>
            )) || (
              <Empty description="No product batch details available" />
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default VendorAnalyticsDashboard;