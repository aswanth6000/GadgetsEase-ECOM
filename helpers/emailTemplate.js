const Mailgen = require('mailgen')
const Product = require('../model/product')
const Order = require('../model/order')

const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: 'GadgetEase',
    link: 'https://www.example.com', // Your website URL
    logo: 'https://www.example.com/logo.png', // Your logo URL
  },
}); 

module.exports = {
  generateOrderConfirmation: (userName, orderId, orderItems, ordertotalAmount) => {
    const email = {
      body: {
        name: userName,
        intro: 'Your order has been placed successfully.',
        table: {
          data: [],
        },
        action: {
          instructions: 'You can track your order using the link below:',
          button: {
            color: '#22BC66',
            text: 'Track Your Order',
            link: `https://www.gadgetEase.com/orders/${orderId}`,
          },
        },
        outro: 'Thank you for shopping with us!',
      },
    };

    // Calculate the grand total
    let grandTotal = 0;
    // Populate the table data with order items
    orderItems.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      grandTotal += itemTotal;
      console.log(item.image);
      email.body.table.data.push({
        item: item.name, // Assuming you have a 'name' field in your Product schema
        price: `₹${item.price}`,
        quantity: item.quantity,
        total: `₹${itemTotal}`,    // Add a column for the total amount per item
      });
    });

    // Add a row for the grand total
    email.body.table.data.push({
      item: 'Grand Total',
      price: '', // Leave this empty for formatting
      quantity: '', // Leave this empty for formatting
      total: `₹${ordertotalAmount}`, // Display the grand total
    });

    // Add a shipping time message
    email.body.shippingTime = 'Your order will be shipped within 2-4 business days.';

    // Generate the email HTML
    const mailGenerator = new Mailgen({
      theme: 'default',
      product: {
        name: 'GadgetEase',
        link: 'https://www.gadgetEase.com',
        // You can customize the product logo, if available.
      },
    });

    return mailGenerator.generate(email);
  },
  generateOrderStatusUpdate: (userName, orderId, newStatus) => {
    const email = {
      body: {
        name: userName,
        intro: `Your order ${orderId} has been : ${newStatus}.`,
        action: {
          instructions: 'You can view your order details using the link below:',
          button: {
            color: '#22BC66',
            text: 'View Order Details',
            link: `https://www.gadgetEase.com/orders/${orderId}`,
          },
        },
      },
    };

    // Generate the email HTML
    return mailGenerator.generate(email);
  },
};