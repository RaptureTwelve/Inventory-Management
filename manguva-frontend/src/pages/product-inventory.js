import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Button, Modal, Form, InputNumber, Space, message, Card, Select } from 'antd';
import { PrinterOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
// import ReactToPrint from 'react-to-print';
// import Barcode from 'react-barcode';
import {QRCodeSVG}  from 'qrcode.react';
import { useSelector } from 'react-redux';
import LoadingAnimation from '../app/services/animationLoading';

const { Option } = Select;

const InventoryPage = () => {
    const { id } = useParams();
    const [inventory, setInventory] = useState([]);
    const [product, setProduct] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [stockBatches, setStockBatches] = useState([{id: null, label: 'New Unit'}]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'NONE'];
    const [barcodeItem, setBarcodeItem] = useState(null);
    const [isBarcodeVisible, setIsBarcodeVisible] = useState(false);
    const barcodeRef = useRef();
    const role = useSelector((state) => state.auth.role);
    const [messageApi, contextHolder] = message.useMessage();
  
    const fetchInventoryData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/products/${id}/inventory`);
        setInventory(res.data.inventory);
        setProduct(res.data.product);
      } catch (error) {
        messageApi.error('Failed to fetch inventory data');
      } finally {
        setLoading(false);
      }
    };
  
    // Fetch stock batches separately
    const fetchStockBatches = async () => {
      try {
        const res = await axios.get(`/stock-batches/?product=${id}`);
        setStockBatches([{id: null, label: 'New Unit'}, ...res.data]);
      } catch (error) {
        messageApi.error('Failed to fetch stock batches');
      }
    };
  
    useEffect(() => {
      fetchInventoryData();
      fetchStockBatches();
    }, [id]);
    
      const handleAddInventory = () => {
        setIsModalVisible(true);
      };
    
      const handleSubmit = async (values) => {
        try {
          setLoading(true);
          const payload = sizes
            .filter(size => values[size] > 0)
            .map(size => ({
              product: id,
              size: size === 'NONE' ? '' : size,
              quantity: values[size],
              batch_id: values.batch_id
            }));
    
          await axios.post('/products/add/inventory', payload);
          messageApi.success('Inventory added successfully');
          setIsModalVisible(false);
          form.resetFields();
          await fetchInventoryData(); // Refresh inventory
          await fetchStockBatches(); // Refresh batches
        } catch (error) {
          messageApi.error('Failed to add inventory');
        } finally {
          setLoading(false);
        }
      };
  
    const columns = [
      {
        title: 'Size',
        dataIndex: 'size',
        key: 'size',
        render: size => size || 'NONE'
      },
      {
        title: 'SKU',
        dataIndex: 'sku',
        key: 'sku',
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
            <Space size="middle">
              <Button 
                icon={<PrinterOutlined />} 
                onClick={() => handlePrintBarcode(record)}
                title="Print Barcode"
              />
              {role === 2 &&
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleDeleteInventory(record.id, record.sku)}
                  title="Delete"
                />
              }
            </Space>
          ),
      },
    ];

    const handlePrintBarcode = (inventoryItem) => {
        setBarcodeItem(inventoryItem);
        setIsBarcodeVisible(true);
      };
    
      const handleDeleteInventory = async (inventoryId, sku) => {
        try {
          await axios.delete(`/products/delete/${inventoryId}/inventory`);
          messageApi.success('Inventory deleted successfully');
          setInventory(inventory.filter(item => item.sku !== sku));
        } catch (error) {
          messageApi.error('Failed to delete inventory');
        }
      };
      
  
  
    return (
      <div className="inventory-page">
            {loading && (
              <LoadingAnimation />
            )}

        {contextHolder}

        <Card title="Product Details" style={{ marginBottom: 24 }}>
          <div className="product-info">
            <p><strong>Product:</strong> {product?.product_type}</p>
            <p><strong>Vendor:</strong> {product?.vendor?.vendor_name}</p>
            <p><strong>Contact:</strong> {product?.vendor?.contact_person_name} ({product?.vendor?.phone})</p>
            <p className='d-flex align-items-center'><strong>Color:</strong> 
              <span style={{
                display: 'inline-block',
                width: 20,
                height: 20,
                backgroundColor: product?.color_code,
                marginLeft: 8,
                border: '1px solid #d9d9d9'
              }} />
            </p>
          </div>
        </Card>
  
        <div className="page-header">
          <h2>Inventory Management</h2>
          {role === 2 &&
            <Button 
              type="primary" 
              onClick={handleAddInventory}
              disabled={loading}
            >
              Add Inventory
            </Button>
          }
        </div>
  
        <Table 
          columns={columns} 
          dataSource={inventory} 
          rowKey="id"
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
          width={600}
        >


          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
          >
            <Form.Item
              label="Stock Batch"
              name="batch_id"
              initialValue={null} // This sets the default value
              rules={[
                { 
                  validator: (_, value) => {
                    if (value !== undefined) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Please select a stock batch');
                  }
                }
              ]}
            >
              <Select 
                placeholder="Select batch"
              >
                <Option value={null}>New Unit</Option>
                {stockBatches
                  .filter(batch => batch.id) 
                  .map(batch => (
                    <Option key={batch.id} value={batch.id}>
                      {batch.label}
                    </Option>
                  ))
                }
              </Select>
            </Form.Item>

            {sizes.map(size => (
              <Form.Item
                key={size}
                name={size}
                label={`Quantity (${size === 'NONE' ? 'No Size' : size})`}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            ))}
  
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {isBarcodeVisible && (
            <Modal
                title="Barcode"
                visible={isBarcodeVisible}
                onCancel={() => setIsBarcodeVisible(false)}
                footer={[
                // <ReactToPrint
                //     key="print"
                //     trigger={() => <Button type="primary">Print</Button>}
                //     content={() => barcodeRef.current}
                // />,
                <Button key="close" onClick={() => setIsBarcodeVisible(false)}>
                    Close
                </Button>
                ]}
                width={400}
            >
                <div ref={barcodeRef} style={{ textAlign: 'center', padding: '20px' }}>
                <h3>{product?.product_type} {barcodeItem?.size && `(${barcodeItem.size})`}</h3>
                <p>SKU: {barcodeItem?.sku}</p>
                {barcodeItem?.barcode && (
                    <QRCodeSVG  
                      value={barcodeItem.barcode} 
                      size={200}
                      level="H" 
                      includeMargin={true}
                      renderAs="svg"
                  />
                )}
                {!barcodeItem?.barcode && (
                    <p>No barcode available for this item</p>
                )}
                </div>
            </Modal>
            )}
      </div>
    );
  };
  
  export default InventoryPage;