import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'NONE'];
  const { Option } = Select;

  async function fetchInventoryData()  {
    try {
      setLoading(true);
      const res = await axios.get('/inventory');
      setInventory(res.data);
    } catch (error) {
      message.error('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/inventory/products');
      setProducts(res.data);
    } catch (error) {
      message.error('Failed to fetch products');
    }
  };

  const handleAddInventory = () => {
    fetchProducts();
    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
  
      // Prepare inventory items payload
      const payload = sizes
        .filter(size => values[`quantity_${size}`] > 0) 
        .map(size => ({
          product: values.product, 
          size: size === 'NONE' ? '' : size,
          quantity: values[`quantity_${size}`] 
        }));
  
      if (payload.length === 0) {
        message.warning('Please enter at least one size quantity');
        setLoading(false);
        return;
      }
  
      // Send to backend
      await axios.post('/products/add/inventory', payload);
  
      message.success('Inventory added successfully');
      setIsModalVisible(false);
      form.resetFields();
  
      await fetchInventoryData();
  
    } catch (error) {
      message.error('Failed to add inventory');
    } finally {
      setLoading(false);
    }
  };
  

  const columns = [
    {
      title: 'Product',
      dataIndex: ['product', 'product_type'],
      key: 'product',
    },
    {
      title: 'Vendor',
      dataIndex: ['product', 'vendor_name'],
      key: 'vendor',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
  ];

  return (
    <div className="inventory-container">
      <div className="page-header">
        <h2>Inventory Management</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAddInventory}
        >
          Add Inventory
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={inventory} 
        rowKey={record => `${record.product.id}-${record.size}`}
        loading={loading}
        bordered
      />

    <Modal
    title="Add Inventory Quantities"
    visible={isModalVisible}
    onCancel={() => {
        setIsModalVisible(false);
        form.resetFields();
    }}
    footer={null}
    width={800}
    >
    <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
    >
        <Form.Item
        name="product"
        label="Product"
        rules={[{ required: true, message: 'Please select product' }]}
        >
        <Select
            placeholder="Select product"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
        >
            {products.map(product => (
            <Option key={product.id} value={product.id}>
                {product.product_type} ({product.vendor_name})
            </Option>
            ))}
        </Select>
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
        {sizes.map(size => (
            <Form.Item
            key={size}
            name={`quantity_${size}`}
            label={`${size === 'NONE' ? 'No Size' : size}`}
            initialValue={0}
            >
            <InputNumber 
                min={0} 
                style={{ width: '100%' }} 
                precision={0}
            />
            </Form.Item>
        ))}
        </div>

        <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
            Submit
        </Button>
        </Form.Item>
    </Form>
    </Modal>
    </div>
  );
};

export default Inventory;