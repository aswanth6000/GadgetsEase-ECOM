const User = require('../model/user')
const Product = require('../model/product')
const userHelper = require('../helpers/userHelper')
const functionHelper = require('../helpers/functionHelper')
const Order = require('../model/order')
const Address = require('../model/addresses')
const Transaction = require('../model/transaction')
const paypal = require('paypal-rest-sdk')
const {PAYPAL_MODE, PAYPAL_CLIENT_KEY, PAYPAL_SECRET_KEY} = process.env;


paypal.configure({
    'mode': PAYPAL_MODE, //sandbox or live
    'client_id': PAYPAL_CLIENT_KEY,
    'client_secret': PAYPAL_SECRET_KEY
  });

exports.getIndex = async(req, res)=>{
    try{
        const user = req.session.user;
        const products = await Product.find()
        res.render('./user/index',{user,products})
    }catch(error){
        console.log("Error",error);
    }
}

exports.viewproduct = async (req,res)=>{
    try {
        const user = req.session.user;
        const productId = req.params.productId;
        const product = await Product.findById(productId);
    
        const relatedProductsPromise = Product.find({
          _id: { $ne: productId },
          category: product.category,
        }).exec();
    
        const relatedProducts = await relatedProductsPromise;
    
        res.render('./user/product', { user, product, relatedProducts });
      } catch (error) {
        console.log("error fetching details ", error);
      }
    };
    

exports.getUserHome = async(req, res)=>{
    try{
        const user = req.session.user;
        const products = await Product.find()
        res.render('./user/index',{user,products})
    }catch(error){
        console.log("Error while fetching products",error);
    }
}

exports.getProfile = async(req, res)=>{
    const userId = req.params.userId;
    try {
        const userFromDB = await User.findById(userId);
        if (!userFromDB) {
            return res.status(404).render('error', { errorMessage: 'User not found' });
        }
        res.render('./user/user-profile', { userFromDB });
    } catch (error) {
        console.error('Error fetching user:', error);
        
    }
}

exports.manageAddress = async(req, res)=>{
  try{
    const userId = req.params.userId;
    const user = await User.findById(userId)
      const addresses = await Address.find({ user: userId }).sort({ createdDate: -1 }).exec();
        res.render('./user/address', { addresses, user});
    }catch(error){
        console.log(error);
    }
  }

exports.getAddAddress = async(req,res)=>{
    const userId = req.params.userId;
    try{
        const user = await User.findById(userId);
        if(!user){
            console.log("no user found");
        }
        res.render('./user/address-form',{user})
    }catch(error){
        console.log(error);
    }
  }

  exports.postAddAddress = async (req, res) => {
    const userId = req.params.userId;
    const { type, phone, houseName, name, street, city, state, pinCode } = req.body;

    const addAddressResult = await userHelper.addAddress(userId, type, phone, houseName, name, street, city, state, pinCode);

    if (!addAddressResult.success) {
        return res.status(400).json({ errorMessage: addAddressResult.message });
    }

    res.redirect('/manageaddress/' + userId);
}

exports.removeAddress = async (req, res) => {
    const userId = req.params.userId;
    const addressIndex = req.params.addressIndex;

    const removeAddressResult = await userHelper.removeAddress(userId, addressIndex);

    if (!removeAddressResult.success) {
        return res.status(400).json({ errorMessage: removeAddressResult.message });
    }

    res.redirect('/manageaddress/' + userId);
}

exports.getError = (req,res)=>{
    res.render('./user/error')
}

exports.getEditAddress = async (req, res) => {
  try {
  const addressId = req.params.addressId;
    const address = await Address.findById(addressId);
    res.render('./user/addressEditForm', { address });
  } catch (error) {
    console.log("Error occurred", error);
  }
};
exports.postEditAddress = async (req, res) => {
  const addressId = req.params.addressId;
  const user = req.session.user
  const userId = user._id
  const { type, phone, houseName, name, street, city, state, pinCode } = req.body;

  try {
      const result = await userHelper.editAddress( addressId, type, phone, houseName, name, street, city, state, pinCode);
      if (result.success) {
          res.redirect('/manageaddress/' + userId);
      } else {
          res.status(400).json({ message: 'Address edit failed' });
      }
  } catch (error) {
      console.error('Error editing address:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
}

const calculateSubtotal = (cart) => {
    let subtotal = 0;
    for (const cartItem of cart) {
      subtotal += cartItem.product.discountPrice * cartItem.quantity;
    }
    return subtotal;
  };

exports.getcart = (req,res)=>{
    const userId = req.session.user._id;
    User.findById(userId)
    .populate('cart.product') 
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
        const cart = user.cart;
        cart.forEach((cartItem) => {
        const product = cartItem.product;
      });
      const subtotal = calculateSubtotal(user.cart);
      const subtotalwship = subtotal + 100;
      res.render('./user/cart', { user, cart, subtotal, subtotalwship });
    })
    .catch((err) => {
      console.error('Error fetching user cart:', err);
      res.status(500).json({ error: 'An error occurred while fetching user cart.' });
    });
}
exports.updateQuantity = (req, res) => {
        const userId = req.session.user._id;
        const productId = req.params.productId;
        const newQuantity = req.body.quantity;
      
        // Define the maximum allowed quantity
        const maxQuantity = 2;
      
        User.findById(userId)
          .then((user) => {
            if (!user) {
              return res.status(404).json({ error: 'User not found.' });
            }
      
            const cartItem = user.cart.find((item) =>
              item.product.equals(productId)
            );
      
            if (!cartItem) {
              return res.status(404).json({ error: 'Product not found in cart.' });
            }
      
            // Check if the new quantity is within the allowed range (0 to maxQuantity)
            if (newQuantity >= 0 && newQuantity <= maxQuantity) {
              cartItem.quantity = newQuantity;
              user.save()
                .then(() => {
                  res.sendStatus(200);
                })
                .catch((error) => {
                  console.error('Error updating quantity:', error);
                  res.status(500).json({ error: 'An error occurred while updating quantity.' });
                });
            } else {
              res.status(400).json({ error: `Quantity must be between 0 and ${maxQuantity}.` });
            }
          })
          .catch((error) => {
            console.error('Error fetching user:', error);
            res.status(500).json({ error: 'An error occurred while fetching user.' });
          });
      }
      
exports.deleteCart=(req, res) => {
  const userId = req.session.user._id;
  const productId = req.params.productId;
  User.findById(userId)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      const cartItemIndex = user.cart.findIndex((item) =>
        item.product.equals(productId)
      );

      if (cartItemIndex === -1) {
        return res.status(404).json({ error: 'Product not found in cart.' });
      }
      user.cart.splice(cartItemIndex, 1);
      user
        .save()
        .then(() => {
            const referringPage = req.get('Referer');
            res.redirect(referringPage || '/cart');
        })
        .catch((error) => {
          console.error('Error removing item from cart:', error);
          res.status(500).json({
            error: 'An error occurred while removing item from cart.',
          });
        });
    })
    .catch((error) => {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'An error occurred while fetching user.' });
    });
};


exports.getCartLength = (req, res)=>{
    const user = req.session.user
    const cart = user.cart;
    const cartSize = cart.length;
    const cartData = {
        cartLength : cartSize
    }
    res.json(cartData);
    console.log(cartData);

}


exports.addtocart = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId);
        const productId = req.params.productId;
        const { qty } = req.body;
        const existingCartItem = await User.findOne({
            _id: userId,
            'cart.product': productId,
        });

        if (existingCartItem) {
            await User.updateOne(
                { _id: userId, 'cart.product': productId },
                { $inc: { 'cart.$.quantity': qty } }
            );
        } else {
            await User.findByIdAndUpdate(
                userId,
                {
                    $push: { cart: { product: productId, quantity: qty } },
                },
                { new: true }
            );
        }
        req.session.cartLength = user.cart.length;
        const cartLength = req.session.cartLength;
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getCategory = async (req, res)=>{
    res.render('./user/store')
}
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

    // Create an array to store all the new orders

    // Create an array to store product details for the email
    const orderItems = [];

    // Iterate through the user's cart products
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

exports.getWithdraw = async (req,res)=>{
  const userp = req.session.user;
  const userId = userp._id;
  const user = await User.findById(userId);
  res.render('./user/withdraw', {user})
}

exports.getWallet = async (req, res)=>{
try{
  const userId = req.params.userId;
  const user = await User.findById(userId);
  const transaction = await Transaction.find({user : userId});
  res.render('./user/wallet', {user, transaction});
}catch(error){
  console.log("Error happend", error);
}
}

exports.postWithdraw = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    // Validate and update the user's wallet balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (amount <= 0 || amount > user.walletBalance) {
      return res.status(400).json({ error: 'Invalid withdrawal amount.' });
    }

    user.walletBalance -= amount;
    await user.save();

    // Record the transaction
    const transaction = new Transaction({
      user: userId,
      amount,
      type: 'debit',
    });
    await transaction.save();

    res.json({ message: 'Funds withdrawn successfully.' });
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    res.status(500).json({ error: 'An error occurred while withdrawing funds.' });
  }
};

exports.returnOrder = async(req,res) =>{
try{
  const userId = req.session.user._id
  const orderId = req.params.orderId;
  const order = await Order.findByIdAndUpdate(orderId,  { status: 'return requested' }, { new: true });
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
}
res.redirect('/viewOrders/'+ userId)
}catch(error){
  console.log("Erorr while updating", error);
}

}



