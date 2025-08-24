import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Space, Tag, message } from 'antd';
import { PrinterOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import Bill from '../components/layouts/bill';
import ReactDOMServer from 'react-dom/server';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/transactions/list');
      setOrders(response.data);
    } catch (error) {
      message.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (text) => text.toUpperCase(),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ color: '#888' }}>{record.customer_mobile}</div>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `₹${parseFloat(amount).toFixed(2)}`,
      align: 'right',
    },
    {
      title: 'Payment',
      key: 'payment',
      render: (_, record) => (
        <Tag color={record.payment_method === 'cash' ? 'green' : 'blue'}>
          {record.payment_method.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => {
              setSelectedOrder(record);
              setIsModalVisible(true);
            }}
          />
          <Button 
            icon={<PrinterOutlined />} 
            onClick={() => printReceipt(record)}
          />
        </Space>
      ),
    },
  ];

  const printReceipt = (orderData) => {
    console.log(orderData);
    const billContent = ReactDOMServer.renderToStaticMarkup(
      <Bill order={orderData} />
    );

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

    const billWindow = window.open('', '_blank');
    billWindow.document.write(billHtml);
    billWindow.document.close();
    billWindow.focus();
    billWindow.print();
    billWindow.onafterprint = () => {
      billWindow.close();
    };
  };

  return (
    <div>
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={`Order #${selectedOrder?.order_number}`}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => printReceipt(selectedOrder)}>
            Print
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedOrder && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3>Customer Details</h3>
              <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
              <p><strong>Mobile:</strong> {selectedOrder.customer_mobile}</p>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <h3>Order Summary</h3>
              <p><strong>Subtotal:</strong> ₹{parseFloat(selectedOrder.subtotal).toFixed(2)}</p>
              <p><strong>Discount:</strong> ₹{parseFloat(selectedOrder.discount_total).toFixed(2)}</p>
              <p><strong>GST ({selectedOrder.gst_percentage}%):</strong> ₹{parseFloat(selectedOrder.gst_amount).toFixed(2)}</p>
              <p><strong>Total:</strong> ₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</p>
            </div>
            
            <div>
              <h3>Payment</h3>
              <p><strong>Method:</strong> {selectedOrder.payment_method.toUpperCase()}</p>
              <p><strong>Amount Paid:</strong> ₹{parseFloat(selectedOrder.payment_amount).toFixed(2)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersList;