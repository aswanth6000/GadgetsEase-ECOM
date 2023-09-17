const User = require('../model/user')
const Product = require('../model/product')
const userHelper = require('../helpers/userHelper')
const functionHelper = require('../helpers/functionHelper')
const Order = require('../model/order')
const Address = require('../model/addresses')
const Transaction = require('../model/transaction')
const paypal = require('paypal-rest-sdk')
const {PAYPAL_MODE, PAYPAL_CLIENT_KEY, PAYPAL_SECRET_KEY} = process.env;


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