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


exports.getCategory = async (req, res)=>{
    res.render('./user/store')
}

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



