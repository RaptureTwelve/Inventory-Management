import React from 'react';
import { Button, Typography, Divider } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import ReactToPrint from 'react-to-print';

const { Text, Title } = Typography;

// Helper function to format dates
const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  const options = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }
  
  return date.toLocaleDateString('en-US', options);
};

const Receipt = React.forwardRef(({ order }, ref) => {
  if (!order) return null;

  return (
    <div ref={ref} style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Title level={3}>Boutique Tailor Shop</Title>
        <Text>123 Fashion Street, Style City</Text>
        <br />
        <Text>Phone: 9876543210</Text>
      </div>

      <Divider orientation="left">Order Details</Divider>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div>
          <Text strong>Order #:</Text> {order.order_number}
          <br />
          <Text strong>Date:</Text> {formatDate(order.order_date, true)}
          <br />
          <Text strong>Delivery Date:</Text> {formatDate(order.delivery_date)}
        </div>
        <div>
          <Text strong>Customer:</Text> {order.customer_name}
          <br />
          <Text strong>Mobile:</Text> {order.customer_mobile}
          <br />
          <Text strong>Status:</Text> {order.status.toUpperCase()}
        </div>
      </div>

      <Divider orientation="left">Product Information</Divider>
      <div style={{ marginBottom: '20px' }}>
        <Text strong>Product:</Text> {order.product_name}
        <br />
        <Text strong>Customization:</Text> {order.description}
      </div>

      <Divider orientation="left">Payment Details</Divider>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text strong>Total Amount:</Text>
          <Text>₹{order.total_amount}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text strong>Paid:</Text>
          <Text>₹{order.advance_paid}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text strong>Balance Amount:</Text>
          <Text>₹{order.balance_amount}</Text>
        </div>
      </div>

      <Divider />

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <Text>Thank you for your order!</Text>
        <br />
        <Text>Please bring this receipt when collecting your product</Text>
      </div>
    </div>
  );
});

export default Receipt;