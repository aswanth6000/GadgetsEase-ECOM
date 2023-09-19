const User = require('../model/user')
const Product = require('../model/product')
const userHelper = require('../helpers/userHelper')
const functionHelper = require('../helpers/functionHelper')
const Order = require('../model/order')
const Address = require('../model/addresses')
const Transaction = require('../model/transaction')
const paypal = require('paypal-rest-sdk')
const Cart = require('../model/cart'); 

const {PAYPAL_MODE, PAYPAL_CLIENT_KEY, PAYPAL_SECRET_KEY} = process.env;


const calculateSubtotal = (cart) => {
    let subtotal = 0;
    for (const cartItem of cart) {
      subtotal += cartItem.product.discountPrice * cartItem.quantity;
    }
    return subtotal;
  };

exports.getcart = async (req, res) => {
    const userId = req.session.user._id;

    try {
        const userCart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!userCart) {
            return res.status(404).json({ error: 'User cart not found.' });
        }

        const cart = userCart.items;
        const subtotal = calculateSubtotal(cart);
        const subtotalWithShipping = subtotal + 100;
        const outOfStockError = cart.some(item => cart.quantity < item.quantity); 

        res.render('./user/cart', { user: req.session.user, cart, subtotal, subtotalWithShipping, outOfStockError });
    } catch (err) {
        console.error('Error fetching user cart:', err);
        res.status(500).json({ error: 'An error occurred while fetching user cart.' });
    }
};
exports.updateQuantity = async (req, res) => {
  const userId = req.session.user._id;
  const productId = req.params.productId;
  const newQuantity = req.body.quantity;

  try {
      // Define the maximum allowed quantity
      const maxQuantity = 2;

      const userCart = await Cart.findOne({ user: userId });

      if (!userCart) {
          return res.status(404).json({ error: 'User cart not found.' });
      }

      const cartItem = userCart.items.find((item) =>
          item.product.equals(productId)
      );

      if (!cartItem) {
          return res.status(404).json({ error: 'Product not found in cart.' });
      }

      // Check if the new quantity is within the allowed range (0 to maxQuantity)
      if (newQuantity >= 0 && newQuantity <= maxQuantity) {
          cartItem.quantity = newQuantity;
          await userCart.save();
          res.sendStatus(200);
      } else {
          res.status(400).json({ error: `Quantity must be between 0 and ${maxQuantity}.` });
      }
  } catch (error) {
      console.error('Error updating quantity:', error);
      res.status(500).json({ error: 'An error occurred while updating quantity.' });
  }
};

exports.deleteCart = async (req, res) => {
  const userId = req.session.user._id;
  const productId = req.params.productId;

  try {
      const userCart = await Cart.findOne({ user: userId });

      if (!userCart) {
          return res.status(404).json({ error: 'User cart not found.' });
      }

      const cartItemIndex = userCart.items.findIndex((item) =>
          item.product.equals(productId)
      );

      if (cartItemIndex === -1) {
          return res.status(404).json({ error: 'Product not found in cart.' });
      }

      userCart.items.splice(cartItemIndex, 1);
      await userCart.save();

      const referringPage = req.get('Referer');
      res.redirect(referringPage || '/cart');
  } catch (error) {
      console.error('Error removing item from cart:', error);
      res.status(500).json({ error: 'An error occurred while removing item from cart.' });
  }
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
        const productId = req.params.productId;
        const { qty } = req.body;

        // Check if the user has an existing cart
        const existingCart = await Cart.findOne({ user: userId });
        const newCart = {}

        if (existingCart) {
            // Check if the product already exists in the cart
            const existingCartItem = existingCart.items.find(item => item.product.toString() === productId);

            if (existingCartItem) {
                // If the product exists in the cart, update the quantity
                existingCartItem.quantity += qty;
            } else {
                // If the product is not in the cart, add it
                existingCart.items.push({ product: productId, quantity: qty });
            }

            // Calculate the total based on the cart items
            existingCart.total = existingCart.items.reduce((total, item) => total + (item.quantity || 0), 0);

            // Save the updated cart
            await existingCart.save();
        } else {
            // If the user doesn't have an existing cart, create a new one
            newCart = new Cart({
                user: userId,
                items: [{ product: productId, quantity: qty }],
                total: qty,
            });

            // Save the new cart
            await newCart.save();
        }

        req.session.cartLength = (existingCart || newCart).items.length;
        const cartLength = req.session.cartLength;

        res.json({ message: 'Product added to cart', cartLength });
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
