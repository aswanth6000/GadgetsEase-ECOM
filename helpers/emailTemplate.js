
const emailTemplate = (order) => {
    // Extract order details from the 'order' object
    const { customerName, orderItems, orderTotal } = order;
  
    // Create the email template with dynamic data
    const email = {
      body: {
        name: `Dear ${customerName},`,
        intro: 'Thank you for placing your order with GadgetEase!',
        table: {
          data: orderItems.map((item) => ({
            item: item.productName,
            description: item.productDescription,
            price: `$${item.productPrice.toFixed(2)}`,
          })),
          columns: {
            // Customize column headers if needed
            custom: {
              item: 'Product',
              description: 'Description',
              price: 'Price',
            },
          },
        },
        outro: `Your total order amount is $${orderTotal.toFixed(2)}. We appreciate your business!`,
      },
    };
  
    return mailGenerator.generate(email);
  };

