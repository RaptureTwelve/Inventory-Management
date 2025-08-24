import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, DatePicker, InputNumber, 
  Select, Space, Tag, message, Card, Divider, Typography, Popconfirm,
  Row, Col, Tooltip, Badge, List, Avatar, Empty
} from 'antd';
import { 
  PlusOutlined, 
  PrinterOutlined, 
  DeleteOutlined, 
  EditOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  NumberOutlined,
  CommentOutlined,
  CloseOutlined,
  SaveOutlined,
  PlusCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import Receipt from './Receipt';
import LoadingAnimation from '../app/services/animationLoading';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const TailorOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  
  // Item details state for create modal
  const [itemDetails, setItemDetails] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ item_name: '', quantity: 1, remarks: '' });

  // Item details state for edit modal
  const [editItemDetails, setEditItemDetails] = useState([]);
  const [editEditingItem, setEditEditingItem] = useState(null);
  const [editNewItem, setEditNewItem] = useState({ item_name: '', quantity: 1, remarks: '' });
  const [messageApi, contextHolder] = message.useMessage();

  const statusColors = {
    ordered: 'blue',
    delivered: 'green',
    cancelled: 'red'
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/tailor/orders/');
      setOrders(response.data);
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Item management functions for CREATE modal
  const addItem = () => {
    if (!newItem.item_name.trim()) {
      message.warning('Please enter item name');
      return;
    }
    
    const item = {
      id: Date.now(),
      item_name: newItem.item_name.trim(),
      quantity: newItem.quantity || 1,
      remarks: newItem.remarks.trim() || ''
    };
    
    setItemDetails([...itemDetails, item]);
    setNewItem({ item_name: '', quantity: 1, remarks: '' });
    messageApi.success('Item added successfully');
  };

  const removeItem = (itemId) => {
    setItemDetails(itemDetails.filter(item => item.id !== itemId));
    messageApi.success('Item removed');
  };

  const startEditItem = (item) => {
    setEditingItem({ ...item });
  };

  const saveEditItem = () => {
    if (!editingItem.item_name.trim()) {
      messageApi.warning('Please enter item name');
      return;
    }
    
    setItemDetails(itemDetails.map(item => 
      item.id === editingItem.id ? { ...editingItem } : item
    ));
    setEditingItem(null);
    messageApi.success('Item updated');
  };

  const cancelEditItem = () => {
    setEditingItem(null);
  };

  // Item management functions for EDIT modal
  const addEditItem = () => {
    if (!editNewItem.item_name.trim()) {
      messageApi.warning('Please enter item name');
      return;
    }
    
    const item = {
      id: Date.now(), // For new items, use timestamp as temporary ID
      item_name: editNewItem.item_name.trim(),
      quantity: editNewItem.quantity || 1,
      remarks: editNewItem.remarks.trim() || '',
      isNew: true // Flag to identify new items
    };
    
    setEditItemDetails([...editItemDetails, item]);
    setEditNewItem({ item_name: '', quantity: 1, remarks: '' });
    messageApi.success('Item added successfully');
  };

  const removeEditItem = async (itemId, isExisting = false) => {
    if (isExisting && !itemId.toString().startsWith('1')) { // Check if it's not a timestamp ID
      try {
        await axios.delete(`/tailor/orders/items/${itemId}/delete/`);
        messageApi.success('Item deleted from database');
      } catch (error) {
        messageApi.error(error.response?.data?.error || 'Failed to delete item');
        return; // Don't remove from UI if API call failed
      }
    }
    setEditItemDetails(editItemDetails.filter(item => item.id !== itemId));
    messageApi.success('Item removed');
  };

  const startEditEditItem = (item) => {
    setEditEditingItem({ ...item });
  };

  const saveEditEditItem = () => {
    if (!editEditingItem.item_name.trim()) {
      messageApi.warning('Please enter item name');
      return;
    }
    
    setEditItemDetails(editItemDetails.map(item => 
      item.id === editEditingItem.id ? { ...editEditingItem } : item
    ));
    setEditEditingItem(null);
    messageApi.success('Item updated');
  };

  const cancelEditEditItem = () => {
    setEditEditingItem(null);
  };

  const handleCreate = async (values) => {
    try {
      if (itemDetails.length === 0) {
        messageApi.error('Please add at least one item detail');
        return;
      }
      setLoading(true);
      const mobile = values.customer_mobile.replace(/^0+/, '');
      const data = { 
        ...values, 
        customer_mobile: mobile,
        delivery_date: values.delivery_date.format('YYYY-MM-DD'),
        item_details: itemDetails.map(({ id, ...item }) => item)
      };
      
      const response = await axios.post('/tailor/orders/add/', data);
      messageApi.success('Order created successfully');
      setIsModalVisible(false);
      form.resetFields();
      setItemDetails([]);
      fetchOrders();
      setCurrentOrder(response.data);
      setIsReceiptVisible(true);
    } catch (error) {
      messageApi.error(error.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setCurrentOrder(record);
    
    // Pre-populate the edit form with order data
    editForm.setFieldsValue({
      customer_name: record.customer_name,
      customer_mobile: record.customer_mobile,
      product_name: record.product_name,
      description: record.description,
      delivery_date: moment(record.delivery_date),
      total_amount: parseFloat(record.total_amount),
      advance_paid: parseFloat(record.advance_paid)
    });

    // Pre-populate item details
    setEditItemDetails(record.item_details || []);
    
    setIsEditModalVisible(true);
  };

  const handleUpdate = async (values) => {
    try {
      if (editItemDetails.length === 0) {
        messageApi.error('Please add at least one item detail');
        return;
      }
      
      setLoading(true);
      const mobile = values.customer_mobile.replace(/^0+/, '');
      
      const updateData = {
        ...values,
        customer_mobile: mobile,
        delivery_date: values.delivery_date.format('YYYY-MM-DD'),
        item_details: editItemDetails.map(item => {
          // For existing items, keep the original ID
          // For new items, remove the temporary ID
          if (item.isNew) {
            const { id, isNew, ...itemData } = item;
            return itemData;
          }
          return {
            id: item.id,
            item_name: item.item_name,
            quantity: item.quantity,
            remarks: item.remarks
          };
        })
      };

      const response = await axios.put(`/tailor/orders/${currentOrder.id}/update/`, updateData);
      messageApi.success('Order updated successfully');
      setIsEditModalVisible(false);
      editForm.resetFields();
      setEditItemDetails([]);
      setCurrentOrder(null);
      fetchOrders();
    } catch (error) {
      messageApi.error(error.response?.data?.error || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, status) => {
    if (status === 'delivered') {
      setExpandedRowKeys([orderId]);
    }
  };

  const handlePayment = async (orderId, amount) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const newAdvance = parseFloat(order.advance_paid) + parseFloat(amount);
      
      if (newAdvance > order.total_amount) {
        messageApi.error('Total payments cannot exceed order amount');
        return;
      }

      const response = await axios.patch(`/tailor/orders/${orderId}/payment/`, { 
        amount: parseFloat(amount) 
      });
      
      messageApi.success('Payment recorded successfully');
      fetchOrders();
      setExpandedRowKeys([]);
    } catch (error) {
      messageApi.error(error.response?.data?.error || 'Failed to record payment');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await axios.delete(`/tailor/orders/${orderId}/delete`);
      messageApi.success('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      messageApi.error(error.response?.data?.error || 'Failed to delete order');
    }
  };

  const disabledDate = (current) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return current && current < today;
  };

  const resetModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setItemDetails([]);
    setEditingItem(null);
    setNewItem({ item_name: '', quantity: 1, remarks: '' });
  };

  const resetEditModal = () => {
    setIsEditModalVisible(false);
    editForm.resetFields();
    setEditItemDetails([]);
    setEditEditingItem(null);
    setEditNewItem({ item_name: '', quantity: 1, remarks: '' });
    setCurrentOrder(null);
  };

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (text) => <Text strong>#{text}</Text>
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div>{record.customer_name}</div>
          <Text type="secondary">{record.customer_mobile}</Text>
        </div>
      )
    },
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name'
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <div>
          <div>Total: ₹{record.total_amount}</div>
          <div>Advance: ₹{record.advance_paid}</div>
          <div>Balance: ₹{record.balance_amount}</div>
        </div>
      )
    },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, record) => (
        <div>
          <div>Order: {formatDate(record.order_date)}</div>
          <div>Delivery: {formatDate(record.delivery_date)}</div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Print Receipt">
            <Button 
              icon={<PrinterOutlined />} 
              onClick={() => {
                setCurrentOrder(record);
                setIsReceiptVisible(true);
              }}
            />
          </Tooltip>
          {record.status === 'ordered' && (
            <>
              <Tooltip title="Edit Order">
                <Button 
                  icon={<EditOutlined />} 
                  onClick={() => handleEdit(record)}
                  style={{ color: 'var(--info-color)' }}
                />
              </Tooltip>
              <Button
                type="primary"
                size="small"
                onClick={() => handleStatusChange(record.id, 'delivered')}
              >
                Mark Delivered
              </Button>
              <Popconfirm
                title="Are you sure to delete this order?"
                onConfirm={() => handleDeleteOrder(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button danger size="small">
                  Delete
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  const renderItemDetailsSection = (
    items, 
    setItems, 
    newItem, 
    setNewItem, 
    editingItem, 
    setEditingItem, 
    addItemFunc, 
    removeItemFunc, 
    startEditFunc, 
    saveEditFunc, 
    cancelEditFunc
  ) => (
    <Card 
      title={
        <Space>
          <NumberOutlined style={{ color: 'var(--warning-color)' }} />
          Item Details
          <Badge count={items.length} style={{ backgroundColor: 'var(--primary-color)' }} />
        </Space>
      }
      size="small"
      style={{
        marginBottom: '16px',
        background: 'var(--hover-bg)',
        border: '1px solid var(--border-color)'
      }}
    >
      {/* Add New Item Form */}
      <div style={{
        background: 'var(--card-bg)',
        padding: '16px',
        borderRadius: '8px',
        border: '1px dashed var(--border-color)',
        marginBottom: '16px'
      }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8}>
            <Input
              placeholder="Item name (e.g., Kurti, Blouse)"
              value={newItem.item_name}
              onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
              prefix={<TagsOutlined style={{ color: 'var(--text-secondary)' }} />}
            />
          </Col>
          <Col xs={12} sm={4}>
            <InputNumber
              placeholder="Qty"
              min={1}
              value={newItem.quantity}
              onChange={(value) => setNewItem({ ...newItem, quantity: value || 1 })}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Input
              placeholder="Remarks (optional)"
              value={newItem.remarks}
              onChange={(e) => setNewItem({ ...newItem, remarks: e.target.value })}
              prefix={<CommentOutlined style={{ color: 'var(--text-secondary)' }} />}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addItemFunc}
              block
              style={{
                background: 'var(--success-color)',
                borderColor: 'var(--success-color)'
              }}
            >
              Add
            </Button>
          </Col>
        </Row>
      </div>

      {/* Items List */}
      {items.length > 0 ? (
        <List
          dataSource={items}
          renderItem={(item, index) => (
            <List.Item
              style={{
                background: 'var(--card-bg)',
                marginBottom: '8px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                padding: '12px 16px'
              }}
              actions={[
                <Tooltip title="Edit item">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => startEditFunc(item)}
                    style={{ color: 'var(--info-color)' }}
                  />
                </Tooltip>,
                <Tooltip title="Remove item">
                {(() => {
                  const isEditModal = setItems === setEditItemDetails;
                  const isExistingItem = isEditModal && item.id && !item.isNew;
                  
                  if (isEditModal && isExistingItem) {
                    return (
                      <Popconfirm
                        title="Delete this item permanently?"
                        description="This will delete the item from the database immediately."
                        onConfirm={() => removeEditItem(item.id, true)}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    );
                  } else {
                    return (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeItemFunc(item.id)}
                      />
                    );
                  }
                })()}
              </Tooltip>
              ]}
            >
              {editingItem && editingItem.id === item.id ? (
                <div style={{ width: '100%' }}>
                  <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} sm={8}>
                      <Input
                        value={editingItem.item_name}
                        onChange={(e) => setEditingItem({ ...editingItem, item_name: e.target.value })}
                        placeholder="Item name"
                      />
                    </Col>
                    <Col xs={12} sm={4}>
                      <InputNumber
                        min={1}
                        value={editingItem.quantity}
                        onChange={(value) => setEditingItem({ ...editingItem, quantity: value || 1 })}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col xs={12} sm={8}>
                      <Input
                        value={editingItem.remarks}
                        onChange={(e) => setEditingItem({ ...editingItem, remarks: e.target.value })}
                        placeholder="Remarks"
                      />
                    </Col>
                    <Col xs={24} sm={4}>
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          icon={<SaveOutlined />}
                          onClick={saveEditFunc}
                        >
                          Save
                        </Button>
                        <Button
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={cancelEditFunc}
                        >
                          Cancel
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </div>
              ) : (
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      style={{ 
                        backgroundColor: 'var(--primary-color)',
                        color: 'white'
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  }
                  title={
                    <Space>
                      <Text strong style={{ color: 'var(--text-color)' }}>
                        {item.item_name}
                      </Text>
                      <Badge 
                        count={`Qty: ${item.quantity}`} 
                        style={{ backgroundColor: 'var(--info-color)' }}
                      />
                      {item.isNew && (
                        <Badge 
                          count="NEW" 
                          style={{ backgroundColor: 'var(--success-color)' }}
                        />
                      )}
                    </Space>
                  }
                  description={
                    <Text type="secondary">
                      {item.remarks || 'No special remarks'}
                    </Text>
                  }
                />
              )}
            </List.Item>
          )}
        />
      ) : (
        <Empty
          description={
            <span style={{ color: 'var(--text-secondary)' }}>
              No items added yet. Add items above to continue.
            </span>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Card>
  );

  return (
    <div className="tailor-orders-container">

          {loading && (
              <LoadingAnimation />
          )}

      {contextHolder}

      <Card
        title={
          <Space>
            <ShoppingCartOutlined style={{ color: 'var(--primary-color)' }} />
            <span>Tailor Orders Management</span>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            style={{
              background: 'var(--primary-color)',
              borderColor: 'var(--primary-color)'
            }}
          >
            New Order
          </Button>
        }
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px'
        }}
      >
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          bordered
          style={{ backgroundColor: 'transparent' }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '0 16px' }}>
                <Title level={5} style={{ color: 'var(--text-color)' }}>Order Details</Title>
                <Text style={{ color: 'var(--text-secondary)' }}>{record.description}</Text>
                
                {record.item_details && record.item_details.length > 0 && (
                  <>
                    <Divider orientation="left">Item Details</Divider>
                    <List
                      size="small"
                      dataSource={record.item_details}
                      renderItem={(item, index) => (
                        <List.Item key={item.id}>
                          <List.Item.Meta
                            avatar={<Badge count={index + 1} style={{ backgroundColor: 'var(--info-color)' }} />}
                            title={`${item.item_name} (Qty: ${item.quantity})`}
                            description={item.remarks || 'No remarks'}
                          />
                        </List.Item>
                      )}
                    />
                  </>
                )}
                
                {record.status === 'ordered' && (
                  <>
                    <Divider />
                    <Form
                      layout="inline"
                      onFinish={(values) => handlePayment(record.id, values.amount)}
                    >
                      <Form.Item
                        name="amount"
                        label="Add Payment"
                        rules={[
                          {
                            required: true,
                            message: 'Please enter amount',
                          },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const amount = parseFloat(value);
                              const balance = parseFloat(record.balance_amount);
                              const total = parseFloat(record.total_amount);
                              const advance = parseFloat(record.advance_paid);

                              if (value === undefined || value === null || isNaN(amount)) {
                                return Promise.reject('Please enter a valid number');
                              }

                              if (balance === 0 && amount === 0) {
                                return Promise.resolve();
                              }

                              if (amount < 0.01 || amount > balance) {
                                return Promise.reject(`Amount must be between 0.01 and ${balance}`);
                              }

                              if (advance + amount > total) {
                                return Promise.reject('Total payments cannot exceed order amount');
                              }

                              return Promise.resolve();
                            }
                          })
                        ]}
                      >
                        <InputNumber 
                          min={0.01}
                          max={Number(record.balance_amount)}
                          precision={2} 
                          style={{ width: '150px' }}
                        />
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary" htmlType="submit">
                          Record Payment
                        </Button>
                      </Form.Item>
                    </Form>
                  </>
                )}
              </div>
            ),
            expandedRowKeys,
            onExpand: (expanded, record) => {
              if (expanded) {
                setExpandedRowKeys([record.id]);
              } else {
                setExpandedRowKeys([]);
              }
            },
            rowExpandable: (record) => record.status === 'ordered',
          }}
        />
      </Card>

      {/* Create Order Modal */}
      <Modal
        title={
          <Space style={{ color: 'var(--text-color)' }}>
            <PlusCircleOutlined style={{ color: 'var(--primary-color)' }} />
            <span>Create New Tailor Order</span>
          </Space>
        }
        visible={isModalVisible}
        onCancel={resetModal}
        footer={null}
        width={1000}
        style={{ top: 20 }}
        bodyStyle={{
          background: 'var(--card-bg)',
          color: 'var(--text-color)'
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          {/* Customer Information */}
          <Card 
            title={
              <Space>
                <TagsOutlined style={{ color: 'var(--info-color)' }} />
                Customer Information
              </Space>
            }
            size="small"
            style={{
              marginBottom: '16px',
              background: 'var(--hover-bg)',
              border: '1px solid var(--border-color)'
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="customer_name"
                  label="Customer Name"
                  rules={[{ required: true, message: 'Please input customer name' }]}
                >
                  <Input placeholder="Enter customer name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="customer_mobile"
                  label="Mobile Number"
                  validateTrigger="onChange"
                  rules={[
                    { required: true, message: 'Please input mobile number' },
                    {
                      pattern: /^\d{10}$/,
                      message: 'Mobile number must be exactly 10 digits',
                    },
                  ]}
                >
                  <Input
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        form.setFieldsValue({ customer_mobile: value });
                      }
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Product Information */}
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined style={{ color: 'var(--success-color)' }} />
                Product Information
              </Space>
            }
            size="small"
            style={{
              marginBottom: '16px',
              background: 'var(--hover-bg)',
              border: '1px solid var(--border-color)'
            }}
          >
            <Form.Item
              name="product_name"
              label="Product Name"
              rules={[{ required: true, message: 'Please input product name' }]}
            >
              <Input placeholder="Enter product name" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Customization Details"
              rules={[{ required: true, message: 'Please input customization details' }]}
            >
              <TextArea 
                rows={3} 
                placeholder="Enter detailed customization requirements..."
              />
            </Form.Item>
          </Card>

          {/* Item Details Section */}
          {renderItemDetailsSection(
            itemDetails,
            setItemDetails,
            newItem,
            setNewItem,
            editingItem,
            setEditingItem,
            addItem,
            removeItem,
            startEditItem,
            saveEditItem,
            cancelEditItem
          )}

          {/* Order Details */}
          <Card 
            title={
              <Space>
                <NumberOutlined style={{ color: 'var(--error-color)' }} />
                Order Details
              </Space>
            }
            size="small"
            style={{
              marginBottom: '16px',
              background: 'var(--hover-bg)',
              border: '1px solid var(--border-color)'
            }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="delivery_date"
                  label="Delivery Date"
                  rules={[{ required: true, message: 'Please select delivery date' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    disabledDate={disabledDate}
                    placeholder="Select delivery date"
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="total_amount"
                  label="Total Amount (₹)"
                  rules={[
                    { required: true, message: 'Please input total amount' },
                    { type: 'number', min: 0.01, message: 'Amount must be positive' }
                  ]}
                >
                  <InputNumber 
                    min={0.01}
                    style={{ width: '100%' }} 
                    precision={2}
                    placeholder="0.00"
                    formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="advance_paid"
                  label="Advance Paid (₹)"
                  rules={[
                    { type: 'number', min: 0, message: 'Advance cannot be negative' }
                  ]}
                >
                  <InputNumber 
                    min={0}
                    style={{ width: '100%' }}
                    precision={2}
                    placeholder="0.00"
                    formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
            <Space>
              <Button onClick={resetModal}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{
                  background: 'var(--primary-color)',
                  borderColor: 'var(--primary-color)'
                }}
              >
                Create Order
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Order Modal */}
      <Modal
        title={
          <Space style={{ color: 'var(--text-color)' }}>
            <EditOutlined style={{ color: 'var(--warning-color)' }} />
            <span>Edit Tailor Order #{currentOrder?.order_number}</span>
          </Space>
        }
        visible={isEditModalVisible}
        onCancel={resetEditModal}
        footer={null}
        width={1000}
        style={{ top: 20 }}
        bodyStyle={{
          background: 'var(--card-bg)',
          color: 'var(--text-color)'
        }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
        >
          {/* Customer Information */}
          <Card 
            title={
              <Space>
                <TagsOutlined style={{ color: 'var(--info-color)' }} />
                Customer Information
              </Space>
            }
            size="small"
            style={{
              marginBottom: '16px',
              background: 'var(--hover-bg)',
              border: '1px solid var(--border-color)'
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="customer_name"
                  label="Customer Name"
                  rules={[{ required: true, message: 'Please input customer name' }]}
                >
                  <Input placeholder="Enter customer name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="customer_mobile"
                  label="Mobile Number"
                  validateTrigger="onChange"
                  rules={[
                    { required: true, message: 'Please input mobile number' },
                    {
                      pattern: /^\d{10}$/,
                      message: 'Mobile number must be exactly 10 digits',
                    },
                  ]}
                >
                  <Input
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        editForm.setFieldsValue({ customer_mobile: value });
                      }
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Product Information */}
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined style={{ color: 'var(--success-color)' }} />
                Product Information
              </Space>
            }
            size="small"
            style={{
              marginBottom: '16px',
              background: 'var(--hover-bg)',
              border: '1px solid var(--border-color)'
            }}
          >
            <Form.Item
              name="product_name"
              label="Product Name"
              rules={[{ required: true, message: 'Please input product name' }]}
            >
              <Input placeholder="Enter product name" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Customization Details"
              rules={[{ required: true, message: 'Please input customization details' }]}
            >
              <TextArea 
                rows={3} 
                placeholder="Enter detailed customization requirements..."
              />
            </Form.Item>
          </Card>

          {/* Item Details Section for Edit */}
          {renderItemDetailsSection(
            editItemDetails,
            setEditItemDetails,
            editNewItem,
            setEditNewItem,
            editEditingItem,
            setEditEditingItem,
            addEditItem,
            removeEditItem,
            startEditEditItem,
            saveEditEditItem,
            cancelEditEditItem
          )}

          {/* Order Details */}
          <Card 
            title={
              <Space>
                <NumberOutlined style={{ color: 'var(--error-color)' }} />
                Order Details
              </Space>
            }
            size="small"
            style={{
              marginBottom: '16px',
              background: 'var(--hover-bg)',
              border: '1px solid var(--border-color)'
            }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="delivery_date"
                  label="Delivery Date"
                  rules={[{ required: true, message: 'Please select delivery date' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    disabledDate={disabledDate}
                    placeholder="Select delivery date"
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="total_amount"
                  label="Total Amount (₹)"
                  rules={[
                    { required: true, message: 'Please input total amount' },
                    { type: 'number', min: 0.01, message: 'Amount must be positive' }
                  ]}
                >
                  <InputNumber 
                    min={0.01}
                    style={{ width: '100%' }} 
                    precision={2}
                    placeholder="0.00"
                    formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="advance_paid"
                  label="Advance Paid (₹)"
                  rules={[
                    { type: 'number', min: 0, message: 'Advance cannot be negative' }
                  ]}
                >
                  <InputNumber 
                    min={0}
                    style={{ width: '100%' }}
                    precision={2}
                    placeholder="0.00"
                    formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
            <Space>
              <Button onClick={resetEditModal}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{
                  background: 'var(--warning-color)',
                  borderColor: 'var(--warning-color)'
                }}
              >
                Update Order
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        title={`Order Receipt #${currentOrder?.order_number || ''}`}
        visible={isReceiptVisible}
        onCancel={() => setIsReceiptVisible(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        {currentOrder && (
          <div style={{ padding: '10px' }}>
            <Receipt order={currentOrder} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TailorOrderList;