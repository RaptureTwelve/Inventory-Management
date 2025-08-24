import { useState, useRef } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Typography,
  Divider,
  Form,
  InputNumber,
  message,
  Badge,
  Statistic,
  Select
} from 'antd';
import {
  ShoppingCartOutlined,
  BarcodeOutlined,
  DeleteOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import axios from 'axios';
import Bill from '../components/layouts/bill';
import ReactDOMServer from 'react-dom/server'

const { Text } = Typography;

const BillingPage = () => {
  const [cart, setCart] = useState([]);
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'cash',
    amount: 0,
  });
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    mobile: ''
  });
  const [loading, setLoading] = useState(false);
  const barcodeInputRef = useRef(null);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const totalDiscountAmount = cart.reduce((sum, item) => {
    const discountAmount = (item.price * item.discount) / 100;
    return sum + discountAmount;
  }, 0);
  
  const priceAfterDiscount = subtotal - totalDiscountAmount;
  
  const tax = priceAfterDiscount * 0.18;
  
  const total = priceAfterDiscount + tax;
  

  const fetchProductByBarcode = async (barcode) => {
    try {
      setLoading(true);
      const response = await axios.get(`/inventory/search/?barcode=${barcode}`);
      return response.data;
    } catch (error) {
      message.error('Product not found or error fetching details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchProductBySku = async (sku) => {
    try {
      setLoading(true);
      const response = await axios.get(`/inventory/search/?sku=${sku}`);
      return response.data;
    } catch (error) {
      message.error('Product not found or error fetching details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (productData) => {
    const { inventory } = productData;
    const product = inventory.product;

    const exists = cart.find(item => item.sku === inventory.sku);
    if (exists) {
      message.warning('Product already in cart');
      return;
    }

    setCart([
      ...cart,
      {
        id: inventory.id,
        sku: inventory.sku,
        name: product.product_type,
        size: inventory.size || 'NONE',
        price: Number(product.mrp),
        discount: Number(product.discount_percentage),
        productId: product.id,
        inventoryId: inventory.id
      }
    ]);
  };

  const removeFromCart = (sku) => {
    setCart(cart.filter(item => item.sku !== sku));
  };

  const processPayment = async () => {
    try {
      setLoading(true);

      const payload = {
        customer: customerInfo,
        items: cart.map(item => ({
          ...item,
          discount_amount: (item.price * item.discount) / 100
        })),
        payment: {
          ...paymentInfo,
          amount: total
        }
      };

      const response = await axios.post('/transactions/create', payload);

      message.success('Transaction completed successfully!');
      printReceipt(response.data.order_data);

      // Reset
      setCart([]);
      setCustomerInfo({ name: '', mobile: '' });
      setPaymentInfo({
        method: 'cash',
        amount: 0
      });
    } catch (error) {
        console.error('error while billing', error);
      message.error('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = (orderData) => {
    console.log(orderData);
    // 1. Render the Bill component to HTML
    const billContent = ReactDOMServer.renderToStaticMarkup(<Bill order={orderData} />);

    // 2. Create the full HTML document
    const billHtml = `
        <html>
        <head>
            <title>Bill #${orderData.order_number}</title>
            <style>
            body { font-family: Arial; max-width: 80mm; margin: 0 auto; padding: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 5px; text-align: left; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            hr { border-top: 1px dashed #000; }
            </style>
        </head>
        <body>
            ${billContent}
        </body>
        </html>
    `;

    // 3. Open a new window and inject the HTML
    const billWindow = window.open('', '_blank');
    billWindow.document.write(billHtml);
    billWindow.document.close();

    // 4. Optionally auto-print and close
    billWindow.focus();
    billWindow.print();
    billWindow.onafterprint = () => {
        billWindow.close();
    };

    message.info('Receipt sent to printer');
    };

  const cartColumns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary">SKU: {record.sku} | Size: {record.size}</Text>
        </div>
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: price => `₹${price.toFixed(2)}`,
      align: 'right'
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_, record) => `${record.discount}%`,
      align: 'right'
    },
    {
      title: 'Discounted Price',
      key: 'discounted_price',
      render: (_, record) => {
        const discountAmount = (record.price * record.discount) / 100;
        return `₹${(record.price - discountAmount).toFixed(2)}`;
      },
      align: 'right'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeFromCart(record.sku)}
        />
      ),
      align: 'center'
    }
  ];

  return (
    <div className="billing-container">
      <Card
        title={
          <Space>
            <ShoppingCartOutlined />
            <span>Boutique Billing</span>
            <Badge count={cart.length} showZero />
          </Space>
        }
        className="billing-card"
      >
        <div className="billing-layout">
          {/* Product Input Section */}
          <div className="scan-section">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<BarcodeOutlined />}
                block
              >
                Scan Barcode
              </Button>

              <Input
                placeholder="Enter SKU manually"
                ref={barcodeInputRef}
                onPressEnter={async (e) => {
                  const sku = e.target.value.trim();
                  if (sku) {
                    const productData = await fetchProductBySku(sku);
                    if (productData) {
                      addToCart(productData);
                      e.target.value = ''; 
                    }
                  }
                }}
              />

              <Divider orientation="left">Customer Details (Optional)</Divider>
              <Input
                placeholder="Customer Name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
              />
              <Input
                placeholder="Mobile Number"
                value={customerInfo.mobile}
                onChange={(e) => setCustomerInfo({...customerInfo, mobile: e.target.value})}
              />
            </Space>

            <Divider />

            {/* Cart Items */}
            <Table
              columns={cartColumns}
              dataSource={cart}
              rowKey="sku"
              pagination={false}
              size="small"
              locale={{ emptyText: 'Scan or add items to begin billing' }}
            />
          </div>

          {/* Payment Summary */}
          <div className="payment-section">
            <Card title="Order Summary" className="summary-card">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Statistic title="Subtotal" value={subtotal.toFixed(2)} prefix="₹" />
                <Statistic 
                  title="Total Discount" 
                  value={totalDiscountAmount.toFixed(2)} 
                  prefix="-₹"
                  valueStyle={{ color: '#f5222d' }}
                />
                <Statistic title="Tax (18%)" value={tax.toFixed(2)} prefix="₹" />
                <Divider style={{ margin: '12px 0' }} />
                <Statistic
                  title="Total"
                  value={total.toFixed(2)}
                  prefix="₹"
                  valueStyle={{ fontSize: 24, fontWeight: 'bold' }}
                />

                <Form layout="vertical" style={{ marginTop: 16 }}>
                  <Form.Item label="Payment Method">
                    <Select
                      value={paymentInfo.method}
                      onChange={value => setPaymentInfo({ ...paymentInfo, method: value })}
                    >
                      <Select.Option value="cash">Cash</Select.Option>
                      <Select.Option value="card">Card</Select.Option>
                      <Select.Option value="upi">UPI</Select.Option>
                    </Select>
                  </Form.Item>

                  {paymentInfo.amount > 0 && (
                    <Form.Item label="Change">
                      <InputNumber
                        style={{ width: '100%' }}
                        value={Math.max(0, paymentInfo.amount - total)}
                        disabled
                        prefix="₹"
                      />
                    </Form.Item>
                  )}

                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<PrinterOutlined />}
                    onClick={processPayment}
                    disabled={cart.length === 0}
                    loading={loading}
                  >
                    Process Payment (₹{total.toFixed(2)})
                  </Button>
                </Form>
              </Space>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BillingPage;