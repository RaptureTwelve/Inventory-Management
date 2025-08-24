import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  DatePicker,
  Button,
  Table,
  Row,
  Col,
  Statistic,
  Spin,
  Empty,
  Typography,
  Divider,
  Space,
  Tag,
  message,
  Tooltip,
  Input
} from 'antd';
import {
  DownloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  CalendarOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

const { Title, Text } = Typography;
const { Search } = Input;

const DailyReportGenerator = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [searchText, setSearchText] = useState('');
  const reportRef = useRef();

  // Fetch report data
  const fetchReportData = async (date) => {
    setLoading(true);
    try {
      const dateStr = date.format('YYYY-MM-DD');
      const response = await axios.get(`/manguva/report/?date=${dateStr}`);
      const data = response.data;
      
      setReportData(data);
      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch report data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(selectedDate);
  }, []);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    fetchReportData(date);
  };

  const handleRefresh = () => {
    fetchReportData(selectedDate);
  };

  // Export functions
  const exportToExcel = () => {
    if (!reportData) {
      message.error('No data to export');
      return;
    }

    const wb = XLSX.utils.book_new();
    
    // KPIs Sheet
    const kpiData = [
      ['Metric', 'Value'],
      ['Net Revenue', `₹${reportData.kpis.net_revenue.toFixed(2)}`],
      ['COGS', `₹${reportData.kpis.cogs.toFixed(2)}`],
      ['Gross Profit', `₹${reportData.kpis.gross_profit.toFixed(2)}`],
      ['Gross Margin %', `${reportData.kpis.gm_percent.toFixed(1)}%`],
      ['GST', `₹${reportData.kpis.gst.toFixed(2)}`],
      ['Total Bills', reportData.kpis.bills],
      ['Total Units', reportData.kpis.units],
      ['Average Order Value', `₹${reportData.kpis.aov.toFixed(2)}`]
    ];
    const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, kpiSheet, 'KPIs');

    // Bills Sheet
    const billsData = [
      ['Order Number', 'Amount', 'Payment Method', 'Time'],
      ...reportData.orders_today.map(order => [
        order.order_number,
        order.total_amount,
        order.payment_method.toUpperCase(),
        dayjs(order.created_at).format('HH:mm:ss')
      ])
    ];
    const billsSheet = XLSX.utils.aoa_to_sheet(billsData);
    XLSX.utils.book_append_sheet(wb, billsSheet, 'Bills Today');

    // Category Revenue Sheet
    const categoryData = [
      ['Category', 'Revenue'],
      ...reportData.category_revenue.map(cat => [
        cat.category,
        cat.revenue
      ])
    ];
    const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, categorySheet, 'Category Revenue');

    // Payment Split Sheet
    const paymentData = [
      ['Payment Method', 'Total Amount'],
      ...reportData.payment_split.map(payment => [
        payment.payment_method.toUpperCase(),
        payment.total
      ])
    ];
    const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
    XLSX.utils.book_append_sheet(wb, paymentSheet, 'Payment Split');

    // Vendor Stock Sheet
    const vendorData = [
      ['Vendor Name', 'Quantity'],
      ...reportData.vendor_instock.map(vendor => [
        vendor.vendor__vendor_name || 'N/A',
        vendor.total_qty
      ])
    ];
    const vendorSheet = XLSX.utils.aoa_to_sheet(vendorData);
    XLSX.utils.book_append_sheet(wb, vendorSheet, 'Vendor Stock');

    // Stock Analysis Sheet
    const stockData = [
      ['Status', 'Count'],
      ['Low Stock', reportData.stock_analysis.low_stock],
      ['Out of Stock', reportData.stock_analysis.out_of_stock],
      ['Old Stock Batches', reportData.stock_analysis.old_stock_batches]
    ];
    const stockSheet = XLSX.utils.aoa_to_sheet(stockData);
    XLSX.utils.book_append_sheet(wb, stockSheet, 'Stock Analysis');

    // Lot Trace Sheet
    const lotData = [
      ['Product Name', 'Batch No', 'Quantity'],
      ...reportData.lot_trace.map(lot => [
        lot.product_name,
        lot.batch_no,
        lot.qty
      ])
    ];
    const lotSheet = XLSX.utils.aoa_to_sheet(lotData);
    XLSX.utils.book_append_sheet(wb, lotSheet, 'Lot Trace');

    const fileName = `Daily_Report_${reportData.report_date}.xlsx`;
    XLSX.writeFile(wb, fileName);
    message.success('Excel file downloaded successfully');
  };

  const exportToPDF = () => {
    if (!reportData) {
      message.error('No data to export');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40);
      doc.text('Daily Sales Report', pageWidth/2, yPosition, { align: 'center' });
      yPosition += 10;
      
      doc.setFontSize(14);
      doc.text(`Report Date: ${dayjs(reportData.report_date).format('DD MMMM YYYY')}`, pageWidth/2, yPosition, { align: 'center' });
      yPosition += 20;

      // KPIs Section
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text('Sales Analytics', 20, yPosition);
      yPosition += 15;

      // KPI Table manually
      doc.setFontSize(12);
      const kpiItems = [
        ['Net Revenue', `₹${reportData.kpis.net_revenue.toFixed(2)}`],
        ['COGS', `₹${reportData.kpis.cogs.toFixed(2)}`],
        ['Gross Profit', `₹${reportData.kpis.gross_profit.toFixed(2)}`],
        ['Gross Margin %', `${reportData.kpis.gm_percent.toFixed(1)}%`],
        ['GST', `₹${reportData.kpis.gst.toFixed(2)}`],
        ['Total Bills', reportData.kpis.bills.toString()],
        ['Total Units', reportData.kpis.units.toString()],
        ['AOV', `₹${reportData.kpis.aov.toFixed(2)}`]
      ];

      kpiItems.forEach(([key, value], index) => {
        const y = yPosition + (index * 8);
        doc.text(`${key}:`, 25, y);
        doc.text(value, 100, y);
      });

      yPosition += kpiItems.length * 8 + 20;

      // Bills Today Section
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text('Bills Today', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.text('Order Number', 25, yPosition);
      doc.text('Amount', 80, yPosition);
      doc.text('Payment', 120, yPosition);
      doc.text('Time', 160, yPosition);
      yPosition += 8;

      reportData.orders_today.forEach((order, index) => {
        const y = yPosition + (index * 8);
        if (y > 270) {
          doc.addPage();
          yPosition = 20;
          return;
        }
        doc.text(order.order_number, 25, y);
        doc.text(`₹${order.total_amount.toFixed(2)}`, 80, y);
        doc.text(order.payment_method.toUpperCase(), 120, y);
        doc.text(dayjs(order.created_at).format('HH:mm:ss'), 160, y);
      });

      yPosition += reportData.orders_today.length * 8 + 20;

      // Category Revenue
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text('Revenue by Category', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.text('Category', 25, yPosition);
      doc.text('Revenue', 100, yPosition);
      yPosition += 8;

      reportData.category_revenue.forEach((cat, index) => {
        const y = yPosition + (index * 8);
        doc.text(cat.category.toString(), 25, y);
        doc.text(`₹${cat.revenue.toFixed(2)}`, 100, y);
      });

      yPosition += reportData.category_revenue.length * 8 + 20;

      // Payment Split
      doc.setFontSize(16);
      doc.text('Payment Method Split', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.text('Method', 25, yPosition);
      doc.text('Total', 100, yPosition);
      yPosition += 8;

      reportData.payment_split.forEach((payment, index) => {
        const y = yPosition + (index * 8);
        doc.text(payment.payment_method.toUpperCase(), 25, y);
        doc.text(`₹${payment.total.toFixed(2)}`, 100, y);
      });

      yPosition += reportData.payment_split.length * 8 + 20;

      // Stock Analysis
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text('Stock Analysis', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      doc.text(`Low Stock: ${reportData.stock_analysis.low_stock}`, 25, yPosition);
      yPosition += 10;
      doc.text(`Out of Stock: ${reportData.stock_analysis.out_of_stock}`, 25, yPosition);
      yPosition += 10;
      doc.text(`Old Stock Batches: ${reportData.stock_analysis.old_stock_batches}`, 25, yPosition);
      yPosition += 20;

      // Lot Trace
      doc.setFontSize(16);
      doc.text('Lot Trace Analysis', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.text('Product', 25, yPosition);
      doc.text('Batch', 100, yPosition);
      doc.text('Qty', 150, yPosition);
      yPosition += 8;

      reportData.lot_trace.forEach((lot, index) => {
        const y = yPosition + (index * 8);
        if (y > 270) {
          doc.addPage();
          yPosition = 20;
          return;
        }
        doc.text(lot.product_name, 25, y);
        doc.text(lot.batch_no.toString(), 100, y);
        doc.text(lot.qty.toString(), 150, y);
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Generated on ${dayjs().format('DD MMM YYYY [at] HH:mm:ss')} - Page ${i} of ${pageCount}`,
          pageWidth/2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      const fileName = `Daily_Report_${reportData.report_date}.pdf`;
      doc.save(fileName);
      message.success('PDF file downloaded successfully');
    } catch (error) {
      console.error('PDF Export Error:', error);
      message.error('Failed to generate PDF. Please try again.');
    }
  };

  // Table columns with search functionality
  const getColumnSearchProps = (dataIndex, title) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${title}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()) : '',
  });

  const ordersColumns = [
    {
      title: 'Order ID',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 150,
      ...getColumnSearchProps('order_number', 'Order ID'),
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `₹${amount.toFixed(2)}`,
      align: 'right',
      sorter: (a, b) => a.total_amount - b.total_amount,
    },
    {
      title: 'Payment Method',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method) => (
        <Tag color={method === 'cash' ? 'green' : 'blue'}>
          {method.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Cash', value: 'cash' },
        { text: 'UPI', value: 'upi' },
        { text: 'Card', value: 'card' },
      ],
      onFilter: (value, record) => record.payment_method === value,
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('HH:mm:ss'),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
  ];

  const categoryColumns = [
    {
      title: 'Category ID',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue) => `₹${revenue.toFixed(2)}`,
      align: 'right',
    },
  ];

  const paymentColumns = [
    {
      title: 'Payment Method',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method) => method.toUpperCase(),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total',
      key: 'total',
      render: (total) => `₹${total.toFixed(2)}`,
      align: 'right',
    },
  ];

  const vendorColumns = [
    {
      title: 'Vendor Name',
      dataIndex: 'vendor__vendor_name',
      key: 'vendor__vendor_name',
      render: (name) => name || 'N/A',
    },
    {
      title: 'Quantity',
      dataIndex: 'total_qty',
      key: 'total_qty',
      align: 'right',
    },
  ];

  const lotTraceColumns = [
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Batch No.',
      dataIndex: 'batch_no',
      key: 'batch_no',
    },
    {
      title: 'Quantity',
      dataIndex: 'qty',
      key: 'qty',
      align: 'right',
    },
  ];

  if (!reportData && !loading) {
    return <Empty description="No report data available" />;
  }

  return (
    <div>
      {/* Header Controls */}
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <CalendarOutlined />
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                allowClear={false}
              />
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<FilePdfOutlined />}
                onClick={exportToPDF}
                disabled={loading || !reportData}
              >
                Export PDF
              </Button>
              <Button 
                type="primary" 
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
                disabled={loading || !reportData}
              >
                Export Excel
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px' }}>Loading report data...</p>
          </div>
        </Card>
      ) : reportData ? (
        <div ref={reportRef}>
          {/* Report Header */}
          <Card style={{ marginBottom: '16px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '8px' }}>
              Daily Sales Report
            </Title>
            <Text style={{ display: 'block', textAlign: 'center', fontSize: '16px' }}>
              Report Date: {dayjs(reportData.report_date).format('DD MMMM YYYY')}
            </Text>
          </Card>

          {/* KPI Section */}
          <Card title="Sales Analytics" style={{ marginBottom: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={
                    <Tooltip title="Total revenue after deducting returns and discounts">
                      Net Revenue
                    </Tooltip>
                  }
                  value={reportData.kpis.net_revenue}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={
                    <Tooltip title="Cost of Goods Sold">
                      COGS
                    </Tooltip>
                  }
                  value={reportData.kpis.cogs}
                  precision={2}
                  prefix="₹"
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={
                    <Tooltip title="Gross Profit = Net Revenue - COGS">
                      Gross Profit
                    </Tooltip>
                  }
                  value={reportData.kpis.gross_profit}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={
                    <Tooltip title="Gross Margin Percentage">
                      GM%
                    </Tooltip>
                  }
                  value={reportData.kpis.gm_percent}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="GST Collected"
                  value={reportData.kpis.gst}
                  precision={2}
                  prefix="₹"
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Bills"
                  value={reportData.kpis.bills}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Units Sold"
                  value={reportData.kpis.units}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={
                    <Tooltip title="Average Order Value">
                      AOV
                    </Tooltip>
                  }
                  value={reportData.kpis.aov}
                  precision={2}
                  prefix="₹"
                />
              </Col>
            </Row>
          </Card>

          {/* Orders Table */}
          <Card title="Bills Today" style={{ marginBottom: '16px' }}>
            <Table
              dataSource={reportData.orders_today}
              columns={ordersColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 600 }}
              size="small"
            />
          </Card>

          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            {/* Category Revenue */}
            <Col xs={24} lg={12}>
              <Card title="Revenue by Category" style={{ height: '100%' }}>
                <Table
                  dataSource={reportData.category_revenue}
                  columns={categoryColumns}
                  rowKey="category"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>

            {/* Payment Split */}
            <Col xs={24} lg={12}>
              <Card title="Payment Method Split" style={{ height: '100%' }}>
                <Table
                  dataSource={reportData.payment_split}
                  columns={paymentColumns}
                  rowKey="payment_method"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            {/* Vendor Stock */}
            <Col xs={24} lg={12}>
              <Card title="Vendor In-Stock (Today's GRNs)" style={{ height: '100%' }}>
                <Table
                  dataSource={reportData.vendor_instock}
                  columns={vendorColumns}
                  rowKey="vendor__vendor_name"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>

            {/* Stock Analysis */}
            <Col xs={24} lg={12}>
              <Card title="Stock Analysis" style={{ height: '100%' }}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic
                      title="Low Stock"
                      value={reportData.stock_analysis.low_stock}
                      valueStyle={{ color: reportData.stock_analysis.low_stock > 0 ? '#faad14' : '#52c41a' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Out of Stock"
                      value={reportData.stock_analysis.out_of_stock}
                      valueStyle={{ color: reportData.stock_analysis.out_of_stock > 0 ? '#f5222d' : '#52c41a' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Old Stock"
                      value={reportData.stock_analysis.old_stock_batches}
                      valueStyle={{ color: reportData.stock_analysis.old_stock_batches > 0 ? '#faad14' : '#52c41a' }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Lot Trace */}
          <Card title="Lot Trace Analysis" style={{ marginBottom: '16px' }}>
            <Table
              dataSource={reportData.lot_trace}
              columns={lotTraceColumns}
              rowKey="product_pk"
              pagination={false}
              size="small"
            />
          </Card>

          {/* Footer */}
          <Card>
            <div style={{ textAlign: 'center', color: '#666' }}>
              <Text>
                Report generated on {dayjs().format('DD MMMM YYYY [at] HH:mm:ss')}
              </Text>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default DailyReportGenerator;