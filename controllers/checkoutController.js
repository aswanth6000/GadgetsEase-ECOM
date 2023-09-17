const User = require('../model/user')
const Product = require('../model/product')
const userHelper = require('../helpers/userHelper')
const functionHelper = require('../helpers/functionHelper')
const Order = require('../model/order')
const Address = require('../model/addresses')
const Transaction = require('../model/transaction')
const paypal = require('paypal-rest-sdk')
const {PAYPAL_MODE, PAYPAL_CLIENT_KEY, PAYPAL_SECRET_KEY} = process.env;
const Coupon = require('../model/coupon')


const calculateSubtotal = (cart) => {
    let subtotal = 0;
    for (const cartItem of cart) {
      subtotal += cartItem.product.discountPrice * cartItem.quantity;
    }
    return subtotal;
  };
  
  exports.getCheckout = async (req, res) => {
    const userId = req.session.user._id;
    try {
      const userp = User.findById(userId);
  
      // Fetch user data, addresses, and cart details in parallel using Promise.all
      const [user, addresses] = await Promise.all([
        User.findById(userId).populate('cart.product').exec(),
        Address.find({ user: userId }).exec(),
      ]);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      const cart = user.cart;
      const subtotal = calculateSubtotal(cart);
      const subtotalWithShipping = subtotal + 100;
  
      // Check if any product in the cart has a quantity less than or equal to zero
      const outOfStockError = cart.some(item => item.product.quantity <= 0);
  
      res.render('./user/checkout', { user, cart, subtotal, subtotalWithShipping, addresses, userp, outOfStockError });
    } catch (err) {
      console.error('Error fetching user data and addresses:', err);
      res.status(500).json({ error: 'An error occurred while fetching user data and addresses.' });
    }
  }
  
  const newOrders = [];
  exports.postCheckout = async (req, res) => {
    try {
      const { address, payment } = req.body;
      console.log(payment);
      const userId = req.session.user._id;
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      const orderItems = [];
      for (const cartItem of user.cart) {
        const productId = cartItem.product;
        const quantity = cartItem.quantity;
        const shippingCost = 100;
  
        const price = await calculateOrderPrice(productId, quantity, shippingCost);
  
        const newOrder = new Order({
          user: userId,
          address: address,
          orderDate: new Date(),
          status: 'pending',
          paymentMethod: payment,
          items: [{
            product: productId,
            quantity: quantity,
            price: price,
          }],
        });
  
        newOrders.push(newOrder);
  
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ error: 'Product not found.' });
        }
  
        if (product.quantity < quantity) {
          return res.status(400).json({ error: 'Not enough quantity in stock.' });
        }
  
        product.quantity -= quantity;
  
        await product.save();
  
        orderItems.push({
          name: product.name,
          price: product.price,
          quantity: quantity,
        });
      }
      if(payment === 'Cash on delivery'){
  
      await Order.insertMany(newOrders);
  
      user.cart = [];
  
      await user.save();
  
      const userName = user.username;
      const orderId = newOrders[0]._id; 
      const userEmail = user.email;
      console.log(orderItems);
      functionHelper.sendOrderConfirmationEmail(userEmail, userName, orderId, orderItems);
  
      res.redirect('/orderPlaced');
      }else{
        const userId = req.session.user._id;
        const user = await User.findById(userId);
  
        if (!user) {
          return res.status(404).json({ error: 'User not found.' });
        }
        const transactionItems = newOrders.map(order => ({
          name: 'item',
          sku: 'item',
          price: order.items[0].price.toFixed(2), 
          currency: 'USD',
          quantity: 1,
        }));
  
        const totalAmount = newOrders.reduce((sum, order) => {
          return sum + order.items[0].price; 
        }, 0);
  
        const create_payment_json = {
          intent: 'sale',
          payer: {
            payment_method: 'paypal',
          },
          redirect_urls: {
            return_url: 'http://localhost:8000/orderPlaced',
            cancel_url: 'http://localhost:8000/cart',
          },
          transactions: [
            {
              item_list: {
                items: transactionItems,
              },
              amount: {
                currency: 'USD',
                total: totalAmount.toFixed(2), // Format as a string with 2 decimal places
              },
              description: 'This is the payment description.',
            },
          ],
        };
  
        paypal.payment.create(create_payment_json, function (error, payment) {
          if (error) {
            console.error(error);
            // Handle the error here
          } else {
            // Redirect the user to PayPal for payment approval
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === 'approval_url') {
                res.redirect(payment.links[i].href);
                break;
              }
            }
          }
        });
        
        
      }
      
    } catch (error) {
      console.log("Error while ordering ", error);
    }
  };
  
  exports.orderDone = async (req, res) => {
    try {
      const { paymentId, PayerID } = req.query;
  
      // Get payment details from PayPal
      paypal.payment.get(paymentId, async (error, payment) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ error: 'Error getting payment details from PayPal.' });
        }
  
        // Verify payment status
        if (payment.state !== 'approved') {
          return res.status(400).json({ error: 'Payment not approved by PayPal.' });
        }
  
        // Find the user and cart
        const userId = req.session.user._id;
        const user = await User.findById(userId);
  
        if (!user) {
          return res.status(404).json({ error: 'User not found.' });
        }
  
        await Order.insertMany(newOrders);
  
        // Clear user's cart
        user.cart = [];
        await user.save();
  
        // Redirect to a success page
        res.render('./user/orderPlaced', { newOrders }); // You can customize this view as needed
      });
    } catch (error) {
      console.error('Error while processing PayPal payment:', error);
      res.status(500).json({ error: 'An error occurred while processing your payment.' });
    }
  };
  
  
  // Function to calculate order price
  async function calculateOrderPrice(productId, quantity, shippingCost) {
    // Retrieve product details
    const product = await Product.findById(productId);
  
    if (!product) {
      throw new Error('Product not found');
    }
  
    // Calculate the total price for the order
    const productPrice = product.price;
    const totalPrice = (productPrice * quantity) + shippingCost;
  
    return totalPrice;
  }
  exports.getOrderDetails = async (req, res) => {
    try {
      // Assuming you have the user ID from the request params
      const userId = req.params.userId;
  
      // Fetch orders for the specific user
      const orders = await Order.find({ user: userId })
        .populate('user')
        .populate({
          path: 'address',
          model: 'Address',
        })
        .populate({
          path: 'items.product',
          model: 'Product',
        })
        .sort({ orderDate: -1 });
  
      res.render('./user/list-orders', { orders });
    } catch (error) {
      console.error("Error occurred:", error);
      res.status(500).send('Internal Server Error');
    }
  };
  
  exports.cancelOrder = async (req, res) => {
    try{
      const orderId = req.params.orderId;
      const canclledOrder = await Order.findByIdAndUpdate(orderId, { status: 'cancelled' }, { new: true });
      if (!canclledOrder) {
        return res.status(404).json({ error: 'Order not found.' });
    }
    res.redirect('/viewOrders')
    }catch(error){
      console.log("Error occoured", error);
    }
  };
  
  exports.orderPlaced = async (req, res) => {
    try {
      // Fetch the most recent order based on the orderDate field in descending order
      const mostRecentOrder = await Order.findOne().sort({ orderDate: -1 })
      .populate('address user');
  
      if (!mostRecentOrder) {
        // Handle the case where no orders are found
        return res.status(404).send('No orders found');
      }
      const user = await User.findById(mostRecentOrder.user)
      console.log(user);
      // Render the 'orderSuccess' template and pass the most recent order details as an object
      res.render('./user/orderSuccess', { order: mostRecentOrder, user });
    } catch (err) {
      // Handle any errors that occur during the process
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  };

exports.applyCoupon = async (req, res) => {
    try {
      const { couponCode } = req.body;
      const userId = req.session.user._id; 
      const coupon = await Coupon.findOne({ code: couponCode });
  
      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found.' });
      }
  
      if (coupon.usersUsed.length >= coupon.limit) {
        return res.status(400).json({ error: 'Coupon limit reached.' });
      }
  
      if (coupon.usersUsed.includes(userId)) {
        return res.status(400).json({ error: 'You have already used this coupon.' });
      }
  
      const orderTotal = 500; 
  
      const discountedTotal = calculateDiscountedTotal(orderTotal, coupon.discount);
  
      coupon.usersUsed.push(userId);
      await coupon.save();
  
      return res.json({ discountedTotal });
    } catch (error) {
      console.error('Error applying coupon: server', error);
      return res.status(500).json({ error: 'An error occurred while applying the coupon.' });
    }
  };
  function calculateDiscountedTotal(total, discount) {
    return total - discount;
  }
  