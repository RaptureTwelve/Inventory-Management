import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Skeleton, Space, ColorPicker, Radio } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined  } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const { Option } = Select;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [fabricTypes, setFabricTypes] = useState([]);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editingProduct, setEditingProduct] = useState(null);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [markupType, setMarkupType] = useState('fixed');
  const [calculatedMRP, setCalculatedMRP] = useState(0);
  const [basePrice, setBasePrice] = useState(null);
  const [markupValue, setMarkupValue] = useState(null);
  const role = useSelector((state) => state.auth.role);
  const [messageApi, contextHolder] = message.useMessage();

  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchDropdownData();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/products');
      console.log(response.data);
      setProducts(response.data);
    } catch (error) {
      messageApi.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const res = await axios.get('/products/add/features');
      setVendors(res.data.vendors);
      setProductTypes(res.data.product_types);
      setFabricTypes(res.data.fabric_types);
    } catch (error) {
      messageApi.error('Failed to fetch dropdown data');
    }
  };
  

  const handleCreate = async (values) => {
    try {
      const mrp = calculateMRP(
        values.base_price, 
        values.markup_price, 
        values.markup_type
      );
  
      const submissionData = {
        ...values,
        markup_price: values.markup_type === 'percent' 
          ? mrp - values.base_price 
          : values.markup_price,
        mrp: Math.floor(mrp)
      };
      
      await axios.post('/products/add', submissionData);
      messageApi.success('Product created successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchProducts();
    } catch (error) {
      messageApi.error('Failed to create product');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/products/${id}`);
      messageApi.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      messageApi.error('Failed to delete product');
    }
  };

  useEffect(() => {
    if (basePrice !== null && markupValue !== null) {
      const newMRP = calculateMRP(basePrice, markupValue, markupType);
      setCalculatedMRP(newMRP);
    }
  }, [basePrice, markupValue, markupType]);
  
  

  const handleEditProduct = (product) => {
    console.log(product);
    const updatedProduct = {
      ...product,
      discount_percentage: parseFloat(product.discount_percentage),
    };
    if (product.markup_type === 'percent') {
      const base = parseFloat(product.base_price);
      const markup = parseFloat(product.markup_price);
      const percent = base > 0 ? (markup / base) * 100 : 0;
      updatedProduct.markup_price = parseFloat(percent.toFixed(2));
    }
    setMarkupType(product.markup_type);
    setEditingProduct(updatedProduct);
    setIsProductModalVisible(true);
    editForm.setFieldsValue(product);
  };
  
  const handleProductUpdate = async (values) => {
    try {
      console.log(values);
      const mrp = calculateMRP(
        values.base_price,
        values.markup_price,
        values.markup_type
      );
  
      const submissionData = {
        ...values,
        markup_price: values.markup_type === 'percent'
          ? mrp - values.base_price
          : values.markup_price,
        mrp: Math.floor(mrp)
      };
  
      await axios.put(`/products/${editingProduct.id}/`, submissionData);
      messageApi.success('Product updated successfully');
      setIsProductModalVisible(false);
      fetchProducts();
    } catch (error) {
      messageApi.error('Failed to update product');
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'product_type',
      key: 'product_type',
    },
    {
      title: 'Fabric',
      dataIndex: 'fabric_type',
      key: 'fabric_type',
    },
    {
      title: 'Color',
      key: 'color_code',
      render: (_, record) => (
        <div style={{
          width: 20,
          height: 20,
          backgroundColor: record.color_code,
          border: '1px solid #d9d9d9'
        }} />
      ),
    },
    {
      title: 'Basic',
      dataIndex: 'base_price',
      key: 'basic',
      render: (value) => `₹${value}`,
    },
    {
      title: 'Markup',
      dataIndex: 'markup_price',
      key: 'markup',
      render: (value) => `₹${value}`,
    },
    {
      title: 'MRP',
      dataIndex: 'mrp',
      key: 'mrp',
      render: (value) => `₹${value}`,
    },
    {
      title: 'Stock',
      dataIndex: 'stock_count',
      key: 'stock_count',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          {role === 2 &&
            <Button icon={<EditOutlined />} onClick={() => handleEditProduct(record)} />
          }       
          <Button type="primary" icon={<EyeOutlined />} onClick={() => navigate(`/products/${record.id}/inventory`)}/>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  const calculateMRP = (basePrice, markupValue, markupType = 'fixed') => {
    const base = Number(basePrice || 0);
    const markup = Number(markupValue || 0);

    if (markupType === 'percent') {
      return base + (base * markup / 100);
    }
    return base + markup;
  };



  return (
    <div className="products-container">
      {contextHolder}
      <div className="page-header">
        <h2>Product Management</h2>
        {role === 2 && 
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsModalVisible(true)}
          >
            Add Product
          </Button>
        }
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <Table 
          columns={columns} 
          dataSource={products} 
          rowKey="id" 
          bordered
        />
      )}

      <Modal
        title="Add New Product"
        visible={isModalVisible}
        onCancel={() => {setIsModalVisible(false); form.resetFields(); setMarkupType('fixed');} }
        footer={null}
        width={800}
      >
        <Form 
          form={form} 
          onFinish={handleCreate} 
          layout="vertical"
          initialValues={{ discount_percentage: 0, color_code: '#000000' }}
        >
          <Form.Item
            name="vendor"
            label="Vendor"
            rules={[{ required: true, message: 'Please select vendor' }]}
          >
            <Select placeholder="Select vendor" showSearch optionFilterProp="children">
              {vendors.map(vendor => (
                <Option key={vendor.id} value={vendor.id}>
                  {vendor.vendor_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="product_type"
            label="Product Type"
            rules={[{ required: true, message: 'Please select product type' }]}
          >
            <Select placeholder="Select product type">
            {productTypes.map(type => (
                <Option key={type.value} value={type.value}>
                {type.label}
                </Option>
            ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="fabric_type"
            label="Fabric Type"
            rules={[{ required: true, message: 'Please select fabric type' }]}
          >
            <Select placeholder="Select fabric type">
            {fabricTypes.map(type => (
                <Option key={type.value} value={type.value}>
                {type.label}
                </Option>
            ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="color_code"
            label="Color"
            rules={[{ required: true, message: 'Please select color' }]}
            getValueFromEvent={(color) => color.toHexString()}
          >
            <ColorPicker format="hex" defaultValue="#1677ff"/>
          </Form.Item>

          <Form.Item
            name="base_price"
            label="Base Price (₹)"
            rules={[{ 
              required: true, 
              message: 'Please enter base price',
              type: 'number',
              min: 0,
            }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              onChange={setBasePrice}
              min={0} 
              step={0.01} 
              precision={2}
            />
          </Form.Item>

          <Form.Item
            label='Markup Value'
            style={{ marginBottom: 16 }}
            required={true}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item name="markup_type" initialValue="fixed">
                <Radio.Group onChange={(e) => setMarkupType(e.target.value)} buttonStyle="solid" optionType="button" style={{ width: '100%', marginBottom: 8 }}>
                  <Radio value="fixed">Fixed Amount (₹)</Radio>
                  <Radio value="percent">Percentage (%)</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="markup_price"
                noStyle
                rules={[
                  { 
                    required: true,
                    message: `Please enter ${markupType === 'fixed' ? 'amount' : 'percentage'}`,
                  },
                  { 
                    validator: (_, value) => {
                      if (markupType === 'percent' && value > 100) {
                        return Promise.reject('Max 100% allowed');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                key={markupType}
                  min={0}
                  style={{ width: '100%' }}
                  onChange={setMarkupValue}
                  placeholder={
                    markupType === 'fixed' 
                      ? 'Enter fixed amount in ₹' 
                      : 'Enter percentage (0-100)'
                  }
                  formatter={value => 
                    markupType === 'fixed' 
                      ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      : `${value}%`
                  }
                  parser={value => 
                    markupType === 'fixed' 
                      ? value.replace(/₹\s?|(,*)/g, '')
                      : value.replace('%', '')
                  }
                />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item
            name="discount_percentage"
            label="Discount (%)"
            rules={[{ 
              type: 'number',
              min: 0,
              max: 100,
              message: 'Discount must be between 0-100%',
              transform: value => parseFloat(value)
            }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              max={100} 
              step={0.5} 
              precision={2}
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
            />
          </Form.Item>

            <Form.Item shouldUpdate={(prevValues, currentValues) => 
            prevValues.base_price !== currentValues.base_price || prevValues.markup_price !== currentValues.markup_price
            }>
              <Form.Item label="Calculated MRP (₹)">
                <Input 
                  disabled
                  value={`₹${calculatedMRP.toFixed(2)}`}
                />
              </Form.Item>
          </Form.Item>



          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Product Modal */}
        <Modal
        title="Edit Product"
        visible={isProductModalVisible}
        onCancel={() => {
            setIsProductModalVisible(false);
            editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        width={800}
        >
        <Form
            form={editForm}
            layout="vertical"
            initialValues={editingProduct || {}}
            onFinish={handleProductUpdate}
        >
            <Form.Item
            name="vendor"
            label="Vendor"
            rules={[{ required: true, message: 'Please select vendor' }]}
            >
            <Select placeholder="Select vendor" showSearch optionFilterProp="children">
                {vendors.map(vendor => (
                <Option key={vendor.id} value={vendor.id}>
                    {vendor.vendor_name}
                </Option>
                ))}
            </Select>
            </Form.Item>

            <Form.Item
            name="product_type"
            label="Product Type"
            rules={[{ required: true, message: 'Please select product type' }]}
            >
            <Select placeholder="Select product type">
                {productTypes.map(type => (
                <Option key={type.value} value={type.value}>
                    {type.label}
                </Option>
                ))}
            </Select>
            </Form.Item>

            <Form.Item
              name="fabric_type"
              label="Fabric Type"
              rules={[{ required: true, message: 'Please select fabric type' }]}
              >
            <Select placeholder="Select fabric type">
                {fabricTypes.map(type => (
                <Option key={type.value} value={type.value}>
                    {type.label}
                </Option>
                ))}
            </Select>
            </Form.Item>

            <Form.Item
            name="color_code"
            label="Color"
            rules={[{ required: true, message: 'Please select color' }]}
            getValueFromEvent={(color) => color.toHexString()}
            >
            <ColorPicker format="hex" />
            </Form.Item>

            <Form.Item
              name="base_price"
              label="Base Price (₹)"
              rules={[{ 
                required: true, 
                message: 'Please enter base price',
                validator: (_, value) => {
                  if (value === null || value === undefined || value === '') {
                    return Promise.reject('Please enter base price');
                  }
                  if (isNaN(Number(value))) {
                    return Promise.reject('Please enter a valid number');
                  }
                  return Promise.resolve();
                }
              }]}
              getValueFromEvent={(value) => {
                // Convert empty string to null to trigger required validation
                return value === '' ? null : Number(value);
              }}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={0} 
                onChange={setBasePrice}
                step={0.01} 
                precision={2}
                formatter={(value) => 
                  `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
            label='Markup Value'
            style={{ marginBottom: 16 }}
            required={true}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item name="markup_type" initialValue="fixed">
                <Radio.Group onChange={(e) => setMarkupType(e.target.value)} buttonStyle="solid" optionType="button" style={{ width: '100%', marginBottom: 8 }}>
                  <Radio value="fixed">Fixed Amount (₹)</Radio>
                  <Radio value="percent">Percentage (%)</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="markup_price"
                noStyle
                rules={[
                  { 
                    required: true,
                    message: `Please enter ${markupType === 'fixed' ? 'amount' : 'percentage'}`,
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  onChange={setMarkupValue}
                  style={{ width: '100%' }}
                  placeholder={
                    markupType === 'fixed' 
                      ? 'Enter fixed amount in ₹' 
                      : 'Enter percentage (0-100)'
                  }
                  formatter={value => 
                    markupType === 'fixed' 
                      ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      : `${value}%`
                  }
                  parser={value => 
                    markupType === 'fixed' 
                      ? value.replace(/₹\s?|(,*)/g, '')
                      : value.replace('%', '')
                  }
                />
              </Form.Item>
            </Space>
          </Form.Item>

            <Form.Item
              name="discount_percentage"
              label="Discount (%)"
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={0} 
                max={100} 
                step={0.5} 
                precision={2}
                formatter={value => `${value}%`}
                parser={value => value.replace('%', '')}
              />
          </Form.Item>

            <Form.Item shouldUpdate>
            {({ getFieldValue }) => (
                <Form.Item label="Calculated MRP (₹)">
                <Input 
                    disabled
                    value={getFieldValue('base_price') && getFieldValue('markup_price') 
                    ? `₹${calculateMRP(getFieldValue('base_price'), getFieldValue('markup_price')).toFixed(2)}`
                    : '₹0.00'
                    }
                />
                </Form.Item>
            )}
            </Form.Item>
        </Form>
        </Modal>
    </div>
  );
};

export default Products;