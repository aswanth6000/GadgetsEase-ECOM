const User = require('../model/user')
const Product = require('../model/product')
const userHelper = require('../helpers/userHelper')
const functionHelper = require('../helpers/functionHelper')
const mongoose = require('mongoose')
const Order = require('../model/order')
const Address = require('../model/addresses')
const Transaction = require('../model/transaction')
const paypal = require('paypal-rest-sdk')
const {PAYPAL_CLIENT_KEY, PAYPAL_SECRET_KEY, PAYPAL_MODE} = process.env;
const session = require('express-session')
const Coupon = require('../model/coupon')
const Cart = require('../model/cart')
const Category = require('../model/category')

paypal.configure({
  'mode': "sandbox", //sandbox or live
  'client_id':PAYPAL_CLIENT_KEY ,
  'client_secret': PAYPAL_SECRET_KEY
});

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
        const categoryPo = await Category.find()

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
        const cartItems = cart.items || [];

        const subtotal = calculateSubtotal(cartItems);
        const subtotalWithShipping = subtotal + 100;
        const outOfStockError = cartItems.some(item => cart.quantity < item.quantity); 
        const maxQuantityErr = cartItems.some(item => cart.quantity > 2 ); 
        res.render('./user/checkout', {
            user,
            cart: cartItems, 
            subtotal,
            subtotalWithShipping,
            addresses,
            outOfStockError,
            maxQuantityErr,
            categoryPo
        });
    } catch (err) {
        console.error('Error fetching user data and addresses:', err);
        res.status(500).json({ error: 'An error occurred while fetching user data and addresses.' });
    }
};

exports.postCheckout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const userId = req.session.user._id;
  const {address, payment, couponCode, coupon} = req.body
  if(coupon === "walletBalance"){
    try {
      const user = await User.findById(userId);
      const cart = await Cart.findOne({ user: userId }).populate({
          path: 'items.product',
          model: 'Product',
      });

      if (!user || !cart) {
          throw new Error('User or cart not found.');
      }

      const cartItems = cart.items || [];
      let totalAmount = 0;

      for (const cartItem of cartItems) {
          const product = cartItem.product;

          if (!product) {
              throw new Error('Product not found.');
          }

          if (product.quantity < cartItem.quantity) {
              throw new Error('Not enough quantity in stock.');
          }

          product.quantity -= cartItem.quantity;

          const shippingCost = 100;
          const itemTotal = product.discountPrice * cartItem.quantity + shippingCost;
          totalAmount += itemTotal;

          await product.save();
      }
      // if(couponCode){
      //   totalAmount = await applyCoup(couponCode,totalAmount, userId)
      // }
      user.walletBalance -= totalAmount;
      await user.save();



      const order = new Order({
          user: userId,
          address: address,
          orderDate: new Date(),
          status: 'Pending',
          paymentMethod: "Paid using Wallet balance",
          totalAmount: totalAmount,
          items: cartItems.map(cartItem => ({
              product: cartItem.product._id,
              quantity: cartItem.quantity,
              price: cartItem.product.discountPrice, 
          })),
      });

      await order.save();

      const transactiondebit = new Transaction({
        user: userId,
        amount : totalAmount,
        type: 'debit', 
        description : `Debited from wallet for order : ${order._id}`
      });
      await transactiondebit.save();

      await Cart.deleteOne({ user: userId })
      const orderItems = cartItems.map((cartItem) => ({
        name: cartItem.product.name, 
        quantity: cartItem.quantity,
        price: cartItem.product.discountPrice,
      }));

      const userEmail = user.email;
      const userName = user.username;
      const orderId = order._id;
      const ordertotalAmount = totalAmount
      functionHelper.sendOrderConfirmationEmail(userEmail, userName, orderId, orderItems, ordertotalAmount);

      await session.commitTransaction();
      session.endSession();

      res.redirect('/orderPlaced')
  } catch (error) {
      console.error('Error placing the order:', error);

      if (session) {
          await session.abortTransaction();
          session.endSession();
      }

      res.status(500).json({ error: 'An error occurred while placing the order.' });
  }
  }
  if(payment === "Cash on delivery"){
  
    try {
      const user = await User.findById(userId);
      const cart = await Cart.findOne({ user: userId }).populate({
          path: 'items.product',
          model: 'Product',
      });

      if (!user || !cart) {
          throw new Error('User or cart not found.');
      }

      const cartItems = cart.items || [];
      let totalAmount = 0;

      for (const cartItem of cartItems) {
          const product = cartItem.product;

          if (!product) {
              throw new Error('Product not found.');
          }

          if (product.quantity < cartItem.quantity) {
              throw new Error('Not enough quantity in stock.');
          }

          product.quantity -= cartItem.quantity;

          const shippingCost = 100;
          const itemTotal = product.discountPrice * cartItem.quantity + shippingCost;
          totalAmount += itemTotal;

          await product.save();
      }
      if(couponCode){
        totalAmount = await applyCoup(couponCode,totalAmount, userId)
      }

      const order = new Order({
          user: userId,
          address: address,
          orderDate: new Date(),
          status: 'Pending',
          paymentMethod: payment,
          totalAmount: totalAmount,
          items: cartItems.map(cartItem => ({
              product: cartItem.product._id,
              quantity: cartItem.quantity,
              price: cartItem.product.discountPrice, 
          })),
      });

      await order.save();

      await Cart.deleteOne({ user: userId })
      const orderItems = cartItems.map((cartItem) => ({
        name: cartItem.product.name, 
        quantity: cartItem.quantity,
        price: cartItem.product.discountPrice,
      }));

      const userEmail = user.email;
      const userName = user.username;
      const orderId = order._id;
      const ordertotalAmount = totalAmount
      functionHelper.sendOrderConfirmationEmail(userEmail, userName, orderId, orderItems, ordertotalAmount);

      await session.commitTransaction();
      session.endSession();

      res.redirect('/orderPlaced')
  } catch (error) {
      console.error('Error placing the order:', error);

      if (session) {
          await session.abortTransaction();
          session.endSession();
      }

      res.status(500).json({ error: 'An error occurred while placing the order.' });
  }
  }else if (payment === "Online Payment"){
    try {
      const user = await User.findById(userId);
      const cart = await Cart.findOne({ user: userId }).populate({
          path: 'items.product',
          model: 'Product',
      });

      if (!user || !cart) {
          throw new Error('User or cart not found.');
      }

      const cartItems = cart.items || [];
      let totalAmount = 0;

      for (const cartItem of cartItems) {
          const product = cartItem.product;

          if (!product) {
              throw new Error('Product not found.');
          }

          if (product.quantity < cartItem.quantity) {
              throw new Error('Not enough quantity in stock.');
          }

          product.quantity -= cartItem.quantity;

          const shippingCost = 100;
          const itemTotal = product.discountPrice * cartItem.quantity + shippingCost;
          totalAmount += itemTotal;

          await product.save();
      }
      if(couponCode){
        totalAmount = await applyCoup(couponCode,totalAmount, userId)
      }

      const order = new Order({
          user: userId,
          address: address,
          orderDate: new Date(),
          status: 'Pending',
          paymentMethod: payment,
          totalAmount: totalAmount,
          items: cartItems.map(cartItem => ({
              product: cartItem.product._id,
              quantity: cartItem.quantity,
              price: cartItem.product.discountPrice, 
          })),
      });
     
      await order.save();

      await Cart.deleteOne({ user: userId })
      const orderItems = cartItems.map((cartItem) => ({
        name: cartItem.product.name, 
        quantity: cartItem.quantity,
        price: cartItem.product.discountPrice,
      }));

      const userEmail = user.email;
      const userName = user.username;
      const orderId = order._id;
      functionHelper.sendOrderConfirmationEmail(userEmail, userName, orderId, orderItems);
      res.render('./user/paymentPage',{order,user})
      await session.commitTransaction();
      session.endSession();

      // res.redirect('/orderPlaced')
  } catch (error) {
      console.error('Error placing the order:', error);

      // Handle any errors here, such as rolling back the transaction
      if (session) {
          await session.abortTransaction();
          session.endSession();
      }

      res.status(500).json({ error: 'An error occurred while placing the order.' });
  }
    
  }

};

exports.createPayment = async (req, res) => {
  try {
    // Get the customer's payment information.
    const { amount, currency, name, email, phone } = req.body;

    // Create a PayPal payment object.
    const createPaymentJson = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal',
      },
      redirect_urls: {
        return_url: 'http://localhost:8000/orderPlaced', // Replace with your success URL
        cancel_url: 'http://localhost:8000/cart', // Replace with your cancel URL
      },
      transactions: [
        {
          amount: {
            total: amount,
            currency: 'USD',
          },
          description: 'Payment for a product or service.',
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
  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    res.status(500).json({ error: 'An error occurred while creating the PayPal payment.' });
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
    // Render the 'orderSuccess' template and pass the most recent order details as an object
    res.render('./user/orderSuccess', { order: mostRecentOrder, user });
  } catch (err) {
    // Handle any errors that occur during the process
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

async function applyCoup(couponCode,discountedTotal, userId){
  const coupon = await Coupon.findOne({code : couponCode})
      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found.' });
      }
      const currentDate = new Date();
      if (coupon.expiryDate && currentDate > coupon.expiryDate) {
        return res.status(400).json({ error: 'Coupon has expired.' });
      }
      if (coupon.usersUsed.length >= coupon.limit) {
        return res.status(400).json({ error: 'Coupon limit reached.' });
      }

      if (coupon.usersUsed.includes(userId)) {
        return res.status(400).json({ error: 'You have already used this coupon.' });
      }
      if (coupon.type === 'percentage') {
        discountedTotal = calculateDiscountedTotal(discountedTotal, coupon.discount);
      } else if (coupon.type === 'fixed') {
        discountedTotal = discountedTotal - coupon.discount;
      }
      coupon.limit--
      coupon.usersUsed.push(userId);
      await coupon.save();
      return discountedTotal;
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
      const canclledOrder = await Order.findById(orderId);
      if(canclledOrder.paymentMethod === 'Online Payment'){
        const canclledOrder = await Order.findByIdAndUpdate(orderId, { status: 'cancel requested' }, { new: true });
      }else if(canclledOrder.paymentMethod === 'Cash on delivery'){
        const canclledOrder = await Order.findByIdAndUpdate(orderId, { status: 'cancelled' }, { new: true });
      }
      if (!canclledOrder) {
        return res.status(404).json({ error: 'Order not found.' });
    }
    res.redirect('/viewOrders')
    }catch(error){
      console.log("Error occoured", error);
    }
  };
  
exports.applyCoupon = async (req, res) => {
    try {
      const { couponCode } = req.body;
      const userId = req.session.user._id; 
      const coupon = await Coupon.findOne({ code: couponCode });
      let errorMessage;
      if (!coupon) {
        return errorMessage = "Coupon not found"
      }
      const currentDate = new Date();
      if (coupon.expiryDate && currentDate > coupon.expiryDate) {
        return errorMessage = "Coupon Expired"
      }
  
      if (coupon.usersUsed.length >= coupon.limit) {
        return errorMessage = "Coupon limit Reached"
      }
  
      if (coupon.usersUsed.includes(userId)) {
        errorMessage = "You already used this coupon"
      }
      const cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'items.product',
                model: 'Product',
            })
            .exec();
      const cartItems = cart.items || [];
  
      const orderTotal = calculateSubtotal(cartItems);
      let discountedTotal = 0;

      if (coupon.type === 'percentage') {
        discountedTotal = calculateDiscountedTotal(orderTotal, coupon.discount);
      } else if (coupon.type === 'fixed') {
        discountedTotal = orderTotal - coupon.discount;
      }
      return res.json({ discountedTotal, errorMessage});
    } catch (error) {
      console.error('Error applying coupon: server', error);
      return res.status(500).json({ error: 'An error occurred while applying the coupon.' });
    }
  };

  function calculateDiscountedTotal(total, discountPercentage) {
    if (discountPercentage < 0 || discountPercentage > 100) {
        throw new Error('Discount percentage must be between 0 and 100.');
    }
    
    const discountAmount = (discountPercentage / 100) * total;
    const discountedTotal = total - discountAmount;

    return discountedTotal;
}
  