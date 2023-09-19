const User = require('../model/user')
const Product = require('../model/product')
const userHelper = require('../helpers/userHelper')
const functionHelper = require('../helpers/functionHelper')
const mongoose = require('mongoose')
const Order = require('../model/order')
const Address = require('../model/addresses')
const Transaction = require('../model/transaction')
const paypal = require('paypal-rest-sdk')
const {PAYPAL_MODE, PAYPAL_CLIENT_KEY, PAYPAL_SECRET_KEY} = process.env;
const session = require('express-session')
const Coupon = require('../model/coupon')
const Cart = require('../model/cart')


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
        const user = await User.findById(userId).exec();
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'items.product',
                model: 'Product',
            })
            .exec();

        const addresses = await Address.find({ user: userId }).exec();

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found.' });
        }

        // Extract the items array from the cart
        const cartItems = cart.items || [];

        const subtotal = calculateSubtotal(cartItems); // Pass cartItems, not cart
        const subtotalWithShipping = subtotal + 100;
        const outOfStockError = cartItems.some(item => item.product.quantity <= 0); // Pass cartItems, not cart
        console.log("555",user,cartItems, subtotal, subtotalWithShipping, addresses, outOfStockError);

        res.render('./user/checkout', {
            user,
            cart: cartItems, // Send the extracted 'cartItems' array
            subtotal,
            subtotalWithShipping,
            addresses,
            outOfStockError,
        });
    } catch (err) {
        console.error('Error fetching user data and addresses:', err);
        res.status(500).json({ error: 'An error occurred while fetching user data and addresses.' });
    }
};


 let order;
  exports.postCheckout = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    const userId = req.session.user._id;

    const user = await User.findById(userId);
    try {
      const { address, payment } = req.body;
  
      if (!user) {
        throw new Error('User not found.');
      }
  
      let totalAmount = 0;
      const orderedProducts = [];
  
      for (const cartItem of user.cart) {
        const product = await Product.findById(cartItem.product);
  
        if (!product) {
          throw new Error('Product not found.');
        }
  
        if (product.quantity < cartItem.quantity) {
          throw new Error('Not enough quantity in stock.');
        }
  
        product.quantity -= cartItem.quantity;
  
        const shippingCost = 100;
        const itemTotal = (product.price * cartItem.quantity) + shippingCost;
        totalAmount += itemTotal;
  
        await product.save();
  
        orderedProducts.push({
          product: product._id,
          quantity: cartItem.quantity,
          price: product.price,
        });
      }
  
      const order = new Order({
        user: userId,
        address: address,
        orderDate: new Date(),
        status: 'Pending',
        paymentMethod: payment,
        items: orderedProducts,
        totalAmount: totalAmount,
      });
  
      await order.save();
  
      if (payment === 'Cash on Delivery') {
        order.status = 'Paid';
        await order.save();
      } else if (payment === 'Online Payment') {
        // Handle online payment method (e.g., PayPal) here
  
        const transactionItems = orderedProducts.map(item => ({
          name: item.product.name,
          sku: item.product._id.toString(), // Use a unique identifier for each product
          price: item.price,
          currency: 'USD',
          quantity: item.quantity,
        }));
  
        const createPaymentJson = {
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
                total: totalAmount.toFixed(2),
              },
              description: 'Payment for your order',
            },
          ],
        };
  
        paypal.payment.create(createPaymentJson, function (error, payment) {
          if (error) {
            console.error('Error creating PayPal payment:', error);
            throw new Error('Error creating PayPal payment.');
          } else {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === 'approval_url') {
                res.redirect(payment.links[i].href);
                return;
              }
            }
            throw new Error('No PayPal approval URL found.');
          }
        });
      }
  
      user.cart = [];
      await user.save();
  
      const userName = user.username;
      const orderId = order._id;
      const userEmail = user.email;
  
      // Send order confirmation email (you need to implement this function)
      functionHelper.sendOrderConfirmationEmail(userEmail, userName, orderId, orderedProducts);
  
      await session.commitTransaction();
      session.endSession();
  
      res.status(200).json({ message: 'Order placed successfully.', order: order });
    } catch (error) {
      console.error('Error placing the order:', error);
  
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
  
      if (user && order) {
        order.status = 'Failed';
        await order.save();
  
        for (const cartItem of user.cart) {
          const product = await Product.findById(cartItem.product);
          if (product) {
            product.quantity += cartItem.quantity;
            await product.save();
          }
        }
      }
  
      res.status(500).json({ error: 'An error occurred while placing the order.' });
    }
  }
  
  exports.orderDone = async (req, res) => {
    try {
      const { paymentId, PayerID } = req.query;
  
      // Get payment details from PayPal
      paypal.payment.get(paymentId, async (error, payment) => {
        if (error) {
          console.error('Error getting payment details from PayPal:', error);
          return res.status(500).json({ error: 'Error getting payment details from PayPal.' });
        }
  
        // Verify payment status
        if (payment.state !== 'approved') {
          console.error('Payment not approved by PayPal:', payment);
          return res.status(400).json({ error: 'Payment not approved by PayPal.' });
        }
  
        // Find the user and cart
        const userId = req.session.user._id;
        const user = await User.findById(userId);
  
        if (!user) {
          return res.status(404).json({ error: 'User not found.' });
        }
  
        await Order.insertMany(order);
        const userName = user.username;
        const orderId = order._id; 
        const userEmail = user.email;
        functionHelper.sendOrderConfirmationEmail(userEmail, userName, orderId, orderItems);
  
        // Clear user's cart
        user.cart = [];
        await user.save();
  
        // Redirect to a success page
        res.render('./user/orderPlaced', { /* You can customize this view as needed */ });
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
  