import React from 'react';

const Bill = ({ order }) => {
  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  // Calculate totals
  const subtotal = parseFloat(order.subtotal || 0);
  const discountTotal = parseFloat(order.discount_total || 0);
  const gstAmount = parseFloat(order.gst_amount || 0);
  const totalAmount = parseFloat(order.total_amount || 0);
  const taxableAmount = subtotal - discountTotal;
  
  // Calculate CGST and SGST (half of total GST each)
  const cgstAmount = gstAmount / 2;
  const sgstAmount = gstAmount / 2;

  const styles = {
    receipt: {
      width: '80mm',
      maxWidth: '300px',
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      lineHeight: '1.2',
      color: '#333',
      backgroundColor: 'white',
      padding: '10px',
      margin: '0 auto'
    },
    receiptHeader: {
      textAlign: 'center',
      marginBottom: '10px',
      borderBottom: '1px dashed #333',
      paddingBottom: '8px'
    },
    storeName: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '3px',
      letterSpacing: '1px'
    },
    storeDetails: {
      fontSize: '9px',
      lineHeight: '1.1',
      marginBottom: '2px'
    },
    invoiceTitle: {
      textAlign: 'center',
      margin: '8px 0',
      fontWeight: 'bold',
      fontSize: '12px'
    },
    receiptInfo: {
      marginBottom: '10px',
      fontSize: '9px'
    },
    infoRow: {
      marginBottom: '1px',
      display: 'flex',
      justifyContent: 'space-between'
    },
    customerInfo: {
      marginBottom: '10px',
      fontSize: '9px'
    },
    customerRow: {
      marginBottom: '1px'
    },
    separator: {
      borderTop: '1px dashed #333',
      margin: '8px 0'
    },
    itemsSection: {
      marginBottom: '10px'
    },
    itemHeader: {
      borderBottom: '1px solid #333',
      paddingBottom: '2px',
      marginBottom: '5px',
      fontWeight: 'bold',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '9px'
    },
    itemRow: {
      marginBottom: '3px',
      fontSize: '9px'
    },
    itemMain: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '1px'
    },
    itemName: {
      flex: 1,
      paddingRight: '5px'
    },
    itemPrice: {
      textAlign: 'right',
      minWidth: '50px'
    },
    itemDetails: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '8px',
      color: '#666',
      marginLeft: '5px'
    },
    totalsSection: {
      marginBottom: '10px'
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '2px',
      fontSize: '9px'
    },
    grandTotal: {
      fontWeight: 'bold',
      fontSize: '11px',
      borderTop: '1px solid #333',
      borderBottom: '1px double #333',
      padding: '3px 0',
      marginTop: '5px'
    },
    paymentSection: {
      marginBottom: '10px',
      fontSize: '9px'
    },
    paymentRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '2px'
    },
    receiptFooter: {
      textAlign: 'center',
      borderTop: '1px dashed #333',
      paddingTop: '8px',
      fontSize: '8px',
      lineHeight: '1.3'
    },
    thankYou: {
      fontWeight: 'bold',
      marginBottom: '3px',
      fontSize: '10px'
    }
  };

  return (
    <div style={styles.receipt}>
      {/* Header */}
      <div style={styles.receiptHeader}>
        <div style={styles.storeName}>MAGUVA</div>
        <div style={styles.storeDetails}>Vandana plaza</div>
        <div style={styles.storeDetails}>GURUDEARA, VISHAKAPATNAM</div>
        <div style={styles.storeDetails}>MUMBAI - 400001</div>
        <div style={styles.storeDetails}>LIN: 37AC3PL9300K22B, PHONE: +91 98765 43210</div>
        <div style={styles.storeDetails}>State Code: 37</div>
      </div>

      {/* Invoice Title */}
      <div style={styles.invoiceTitle}>
        <div>TAX INVOICE</div>
        <div style={{ fontSize: '10px', marginTop: '2px' }}>
          {order.payment_method?.toUpperCase() || 'CASH'} BILL
        </div>
      </div>

      {/* Customer Info */}
      <div style={styles.customerInfo}>
        <div style={styles.customerRow}>
          CUSTOMER: {order.customer_name || 'WALK-IN CUSTOMER'}
        </div>
        <div style={styles.customerRow}>
          PHONE: {order.customer_mobile || 'N/A'}
        </div>
      </div>

      {/* Receipt Info */}
      <div style={styles.receiptInfo}>
        <div style={styles.infoRow}>
          <span>BILL NO:</span>
          <span>{order.order_number}</span>
        </div>
        <div style={styles.infoRow}>
          <span>DATE:</span>
          <span>{formatDate(order.created_at)}</span>
        </div>
        <div style={styles.infoRow}>
          <span>CASHIER:</span>
          <span>ADMIN</span>
        </div>
      </div>

      <div style={styles.separator}></div>

      {/* Items Section */}
      <div style={styles.itemsSection}>
        <div style={styles.itemHeader}>
          <span>ITEM DESCRIPTION</span>
          <span>AMOUNT</span>
        </div>
        
        {order.items?.map((item, index) => {
          const itemPrice = parseFloat(item.price || 0);
          const discountPercentage = parseFloat(item.discount_percentage || 0);
          const discountAmount = parseFloat(item.discount_amount || 0);
          const quantity = parseInt(item.quantity || 1);
          const lineTotal = parseFloat(item.line_total || 0);

          return (
            <div key={index} style={styles.itemRow}>
              <div style={styles.itemMain}>
                <div style={styles.itemName}>
                  {item.product_name?.toUpperCase() || 'ITEM'}
                  {item.size && item.size !== 'NONE' ? ` - ${item.size}` : ''}
                </div>
                <div style={styles.itemPrice}>{formatCurrency(lineTotal)}</div>
              </div>
              <div style={styles.itemDetails}>
                <span>QTY: {quantity} × {formatCurrency(itemPrice)}</span>
                <span>
                  DISC: {discountPercentage}% ({formatCurrency(discountAmount)})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.separator}></div>

      {/* Totals Section */}
      <div style={styles.totalsSection}>
        <div style={styles.totalRow}>
          <span>SUB TOTAL:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div style={styles.totalRow}>
          <span>DISCOUNT:</span>
          <span>{formatCurrency(discountTotal)}</span>
        </div>
        <div style={styles.totalRow}>
          <span>TAXABLE AMT:</span>
          <span>{formatCurrency(taxableAmount)}</span>
        </div>
        <div style={styles.totalRow}>
          <span>CGST @ 9%:</span>
          <span>{formatCurrency(cgstAmount)}</span>
        </div>
        <div style={styles.totalRow}>
          <span>SGST @ 9%:</span>
          <span>{formatCurrency(sgstAmount)}</span>
        </div>
        <div style={{ ...styles.totalRow, ...styles.grandTotal }}>
          <span>TOTAL AMOUNT:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Payment Section */}
      <div style={styles.paymentSection}>
        <div style={styles.paymentRow}>
          <span>PAYMENT MODE:</span>
          <span>{order.payment_method?.toUpperCase() || 'CASH'}</span>
        </div>
        {order.payment_method === 'cash' && (
          <>
            <div style={styles.paymentRow}>
              <span>CASH RECEIVED:</span>
              <span>{formatCurrency(order.payment_amount || totalAmount)}</span>
            </div>
            <div style={styles.paymentRow}>
              <span>CHANGE:</span>
              <span>{formatCurrency(Math.max(0, (order.payment_amount || totalAmount) - totalAmount))}</span>
            </div>
          </>
        )}
        {order.payment_method !== 'cash' && (
          <div style={styles.paymentRow}>
            <span>AMOUNT PAID:</span>
            <span>{formatCurrency(order.payment_amount || totalAmount)}</span>
          </div>
        )}
      </div>

      <div style={styles.separator}></div>

      {/* Footer */}
      <div style={styles.receiptFooter}>
        <div style={styles.thankYou}>THANK YOU FOR SHOPPING!</div>
        <div>VISIT US AGAIN</div>
        <div style={{ marginTop: '5px' }}>
          <div>* Terms And COnditions *</div>
          <div>* EXCHANGE TIME BETWEEN 1-4PM</div>
          <div>* GOODS WILL BE EXCHANGE WITHIN 7 DAYS OF PURCHASE DATE</div>
          <div>* NO COLOUR GUARANTEE</div>
        </div>
      </div>
    </div>
  );
};

export default Bill;