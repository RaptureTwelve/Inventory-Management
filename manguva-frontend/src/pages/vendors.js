import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Skeleton, Space } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingVendor, setEditingVendor] = useState(null);
    const [isVendorModalVisible, setIsVendorModalVisible] = useState(false);
    const [editForm] = Form.useForm();
  
    const navigate = useNavigate();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/vendors');
      setVendors(response.data);
    } catch (error) {
      message.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      await axios.post('/vendors/add', values);
      message.success('Vendor created successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchVendors();
    } catch (error) {
      message.error('Failed to create vendor');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/vendors/${id}`);
      message.success('Vendor deleted successfully');
      fetchVendors();
    } catch (error) {
      message.error('Failed to delete vendor');
    }
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setIsVendorModalVisible(true);
    editForm.setFieldsValue(vendor);
  };
  
  const handleVendorUpdate = async (values) => {
    try {
      await axios.put(`/vendors/${editingVendor.id}/`, values);
      message.success('Vendor updated successfully');
      setIsVendorModalVisible(false);
      fetchVendors(); // Refresh vendor list
    } catch (error) {
      message.error('Failed to update vendor');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
    },
    {
      title: 'Contact',
      dataIndex: 'contact_person_name',
      key: 'contact_person_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/vendors/vendor-analytics/${record.id}`)}
            title="View Analytics"
          />
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditVendor(record)}
          />
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="vendors-container">
      <div className="page-header">
        <h2>Vendor Management</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalVisible(true)}
        >
          Add Vendor
        </Button>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <Table 
          columns={columns} 
          dataSource={vendors} 
          rowKey="id" 
          bordered
        />
      )}

      <Modal
        title="Add New Vendor"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="vendor_name"
            label="Vendor Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="contact_person_name"
            label="Contact Person"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="street"
            label="Street"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="city"
            label="City"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="state"
            label="State"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="zip_code"
            label="Zip Code"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="country"
            label="Country"
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

        <Modal
            title="Edit Vendor"
            visible={isVendorModalVisible}
            onCancel={() => setIsVendorModalVisible(false)}
            onOk={() => form.submit()}
            width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={editingVendor || {}}
                    onFinish={handleVendorUpdate}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item name="vendor_name" label="Vendor Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="contact_person_name" label="Contact Person" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ type: 'email', required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="street" label="Street Address" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="city" label="City" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="state" label="State" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="zip_code" label="Zip Code" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="country" label="Country" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    </div>
                </Form>
            </Modal>
    </div>
  );
};

export default Vendors;