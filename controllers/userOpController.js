const express = require('express')
const User = require('../model/user')
const Product = require('../model/product')
const multer = require('multer');
const userHelper = require('../helpers/userHelper')
const {isAuthenticated} = require('../middleware/isUserAuth')
const nocache = require('nocache')
const multerHelper = require('../helpers/functionHelper')
const Order = require('../model/order')
const Address = require('../model/addresses')


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
      const addresses = await Address.find({ user: userId }).exec();
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
    const userId = req.params.userId;
    const addressId = req.params.addressId;
    const { type, phone, houseName, name, street, city, state, pinCode } = req.body;

    try {
        const result = await userHelper.editAddress(userId, addressId, type, phone, houseName, name, street, city, state, pinCode);
        if (result.success) {
            res.redirect('/manageaddress/' + userId);
        } else {
            res.send.json({message : 'Address edit failed'})
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
        req.app.locals.io.emit('cartUpdate', { userId, cartLength });
        console.log(`Emitted 'cartUpdate' event for user ${userId} with cart length ${cartLength}`);
        const referringPage = req.get('Referer');
        res.redirect(referringPage || '/cart');
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getCategory = async (req, res)=>{
    res.render('./user/store')
}

exports.getCheckout = (req,res)=>{
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
    });
    const subtotal = calculateSubtotal(user.cart);
    const subtotalwship = subtotal + 100;
    res.render('./user/checkout', { user, cart, subtotal, subtotalwship });
  })
  .catch((err) => {
    console.error('Error fetching user cart:', err);
    res.status(500).json({ error: 'An error occurred while fetching user cart.' });
  });
}

exports.postCheckout = async (req, res) => {
  try {
    const { address, payment } = req.body;
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Create an array to store all the new orders
    const newOrders = [];

    // Iterate through the user's cart products
    for (const cartItem of user.cart) {
      const productId = cartItem.product;
      const quantity = cartItem.quantity;
      const shippingCost = 100;

      // Calculate the price for each order
      const price = await calculateOrderPrice(productId, quantity, shippingCost);

      // Create a new order object
      const newOrder = {
        user: userId,
        address: address,
        orderDate: new Date(),
        status: 'active',
        paymentMethod: payment,
        items: [{
          product: productId,
          quantity: quantity,
          price: price
        }]
      };

      // Push the new order into the array
      newOrders.push(newOrder);

      // Find the product and decrement its quantity in stock
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found.' });
      }

      // Ensure there's enough quantity in stock
      if (product.quantity < quantity) {
        return res.status(400).json({ error: 'Not enough quantity in stock.' });
      }

      // Update the product's quantity in stock
      product.quantity -= quantity;

      // Save the updated product
      await product.save();
    }

    // Now, insert all the new orders into the Order collection
    await Order.insertMany(newOrders);

    // Clear the user's cart
    user.cart = [];

    // Save the user with all the new orders
    await user.save();

    // Redirect to the user's home page
    res.redirect('/userhome');
  } catch (error) {
    console.log("Error while ordering ", error);
    // Handle the error appropriately, e.g., show an error message to the user
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