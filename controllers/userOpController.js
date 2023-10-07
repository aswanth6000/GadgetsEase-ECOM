const User = require('../model/user')
const Product = require('../model/product')
const userHelper = require('../helpers/userHelper')
const functionHelper = require('../helpers/functionHelper')
const Order = require('../model/order')
const Address = require('../model/addresses')
const Transaction = require('../model/transaction')
const Banner = require('../model/banner')
const Ticket = require('../model/ticket')
const cloudinary = require('../config/cloudinaryConfig')
const Coupon = require('../model/coupon')
const Category = require('../model/category')
const Review  = require('../model/review')
const user = require('../model/user')



exports.getIndex = async(req, res)=>{
    try{
        const user = req.session.user;
        const products = await Product.find()
        const banner = await Banner.find()
        const topSelling = await Product.find().sort({ quantity : -1 }).limit(10)
        res.render('./user/index',{user,products, banner, topSelling})
    }catch(error){
        console.log("Error",error);
    }
}

exports.viewproduct = async (req, res) => {
  try {
    const user = req.session.user;
    const productId = req.params.productId;
    const orders = await Order.find(); 
    const reviews = await Review.find({userId : user._id, productId : productId}).populate('userId'); 
    const userReviewed = await Review.find({userId : user._id, productId : productId})

    const product = await Product.findById(productId);
    const categoryPo = await Category.find();
    let ordereItem = false;
    reviews.forEach((review) => {
      review.formattedDate = new Date(review.date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      });
    });
    let userReview = false;
    reviews.forEach((review) => { 
      if (review.userId._id.toString() === user._id.toString()) {
        userReview = true;
      }
    });

    if (
      orders.some((orderObj) => 
        orderObj.user.toString() === user._id.toString() &&
        orderObj.items.some((item) => item.product.toString() === productId)
      )
    ) {
      ordereItem = true;
    }

    const relatedProductsPromise = Product.find({
      _id: { $ne: productId },
      category: product.category,
    }).exec();

    const relatedProducts = await relatedProductsPromise;

    res.render('./user/product', { user, product, relatedProducts, categoryPo, ordereItem, reviews,userReview, userReviewed });
  } catch (error) {
    console.log("error fetching details ", error);
  }
};
  

exports.getUserHome = async(req, res)=>{
    try{
        const user = req.session.user;
        const products = await Product.find();
        const banner = await Banner.find()
        const topSelling = await Product.find().sort({ quantity : -1 }).limit(10)
        const categoryPo = await Category.find()
        res.render('./user/index',{user,products,banner, topSelling, categoryPo})
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


exports.getError = (req,res)=>{
    res.render('./user/error')
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
  const transaction = await Transaction.find({user : userId}).sort({date : -1});
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

exports.updateProfile = async (req, res)=>{
  const userId = req.params.userId;
  const updatedData = req.body;

  const folderName = 'GadgetEaseUploads';

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path,  { public_id: `${folderName}/${req.file.originalname}`});
    updatedData.profileImage = result.secure_url;
  }

  const user = await userHelper.updateProfile(userId, updatedData);

  if (!user) {
    return res.status(404).render('error', { errorMessage: 'User not found' });
  }

  res.redirect(`/profile/${userId}`);
}


exports.getStore = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const categoryPo = await Category.find()
    const category = req.params.category;
    const page = req.params.page || 1;

    const perPage = 20;
    const skip = (page - 1) * perPage;

    const store = await Product.find({ category: category })
      .skip(skip)
      .limit(perPage);

    res.render('./user/store', { store, user, category, currentPage: page, categoryPo });
  } catch (error) {
    console.error('Error fetching store data:', error);
    res.status(500).render('error', { error });
  }
};

exports.orderDetails = async (req, res) =>{
  try{
    const orderId = req.params.orderId
    const orders = await Order.findById(orderId)
    const address = await Address.findById(orders.address)
    res.render('./user/orderDetails',{orders, address})
  }catch(err){
    console.log("errror fetching order details",err);
  }
}

exports.getSupport = async (req, res)=>{
  const userId = req.session.user._id
  try{
    const user = await User.findById(userId)
    res.render('./user/support-center', {user})
  }catch(err){
    console.log("Error occoured", err);
  }
}

exports.getRaiseTicketForm = (req, res)=>{
  res.render('./user/ticketForm')
}

exports.postTicket = async (req, res)=>{
  const userId = req.session.user._id
  const {title, description, priority} = req.body;
  try{
    const ticket = new Ticket({
      user : userId,
      title : title,
      description : description,
      priority : priority
    })
    await ticket.save()
    res.redirect('/userhome')
  }catch(err){
    console.log("Error while sending ticket : ", err);
  }
}            

exports.getAvailableCoupons = async (req, res)=>{
  try {
    const currentDate = new Date();

    const availableCoupons = await Coupon.find({
      expiry: { $gt: currentDate }, 
      limit: { $gt: 0 }, 
    });

    res.render('./user/availableCoupons', {availableCoupons})
  } catch (error) {

    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getSearch = async (req, res)=>{
  const searchInput = req.query.searchInput;
  const user = req.session.user
  const categoryPo = await Category.find()
  try{
    const store = await Product.find({ name: { $regex: searchInput, $options: 'i' } })
    res.render('./user/searchStore', {store, user, categoryPo})
  }catch(err){
    console.log("Search error", err);
  }
}

exports.postReview = async (req, res)=>{
  const reviewText = req.body.description;
  const productId  =req.body.productId
  const rating = req.body.rating;
  const userId = req.session.user._id;
  try{
    const existingReview = await Review.findOne({
      productId: productId,
      userId: userId,
    });

    if (existingReview) {
      existingReview.starRating = rating;
      existingReview.description = reviewText;
      existingReview.date = Date.now();

      await existingReview.save();
    }else{
      const review = new Review({
        productId : productId,
        userId : userId,
        starRating : rating,
        description : reviewText,
        date : Date.now()
      })
      await review.save()
    }
    res.redirect('/viewproduct/' + productId)
  }catch(err){
    console.log("Error occoured while posting review : ", err);
  }
}


exports.viewrating = async (req, res) => {
  try {
    const user = req.session.user;
    const productId = req.params.productId;
    const reviews = await Review.find({userId : user._id}).populate('productId'); 
    const categoryPo = await Category.find();
    reviews.forEach((review) => {
      review.formattedDate = new Date(review.date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      });
    });

    res.render('./user/viewRatingReview', { reviews, user, categoryPo});
  } catch (error) {
    console.log("error fetching details ", error);
  }
};
  
exports.deleteReview = async (req, res)=>{
  try{
    const reviewId = req.params.reviewId;
    const rev = await Review.findByIdAndDelete(reviewId)
    res.redirect('/viewratings')
  }catch(err){
    console.log("Error occoured while deleting review",err);
  }
}

exports.storeFilter = async (req, res)=>{
  const {price, colors, brand} = req.body;
  console.log(price, colors, brand);
  try{
    const user = await User.findById(req.session.user._id);
    const categoryPo = await Category.find()
    const page = req.params.page || 1;
    
    const perPage = 20;
    const skip = (page - 1) * perPage;
    if(price === '0'){
      const category = brand;
      const store = await Product.find({ category: brand, color : colors  })
      .skip(skip)
      .limit(perPage)
      .sort({ price: -1 })
      res.render('./user/store', { store, user, category, currentPage: page, categoryPo });
    }else{
      const store = await Product.find({ category: brand, color : colors })
      .skip(skip)
      .limit(perPage)
      .sort({ price: 1 })
      res.render('./user/store', { store, user, category, currentPage: page, categoryPo });
    }


  }catch(err){
    console.log(err);
  }
}