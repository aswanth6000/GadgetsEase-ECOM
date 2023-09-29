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
const { createInvoice } = require("../helpers/createInvoice");
const PDFDocument = require('pdfkit')
const fs = require("fs");


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
        const products = await Product.find();
        const banner = await Banner.find()
        const topSelling = await Product.find().sort({ quantity : -1 }).limit(10)
        res.render('./user/index',{user,products,banner, topSelling})
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
  const userId = req.session.user._id
    const addressIndex = req.params.addressIndex;

    const removeAddressResult = await userHelper.removeAddress(addressIndex);

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
    // Retrieve the currently logged-in user
    const user = await User.findById(req.session.user._id);

    // Get the category and page parameters from the request
    const category = req.params.category;
    const page = req.params.page || 1; // Default to page 1 if not provided

    // Set the number of items per page and calculate the skip value
    const perPage = 20; // Adjust this based on your desired items per page
    const skip = (page - 1) * perPage;

    // Find products in the specified category with pagination
    const store = await Product.find({ category: category })
      .skip(skip)
      .limit(perPage);

    // Render the store page with the retrieved data
    res.render('./user/store', { store, user, category, currentPage: page });
  } catch (error) {
    // Handle any errors, e.g., by rendering an error page
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
  console.log(title, description, priority, userId);
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
  console.log(searchInput)
  try{
    const store = await Product.find({ name: { $regex: searchInput, $options: 'i' } })
    res.render('./user/searchStore', {store, user})
  }catch(err){
    console.log("Search error", err);
  }
}


// // Function to generate the invoice PDF
// function generateInvoice(order, path) {
//   const doc = new PDFDocument({ size: 'A4', margin: 50 });

//   // Add your invoice content here
  // doc
  //   .fontSize(15)
  //   .text('Invoice', 50, 50)
  //   .fontSize(10)
  //   .text(`Order Date: ${order.orderDate.toDateString()}`, 50, 80)
  //   .text(`Delivery Date: ${order.deliveryDate ? order.deliveryDate.toDateString() : 'N/A'}`, 50, 100)
  //   .text(`Status: ${order.status}`, 50, 120)
  //   .text(`Payment Method: ${order.paymentMethod}`, 50, 140)
  //   .text(`Payment Status: ${order.paymentStatus}`, 50, 160)
  //   .text(`Total Amount: $${order.totalAmount.toFixed(2)}`, 50, 180)
  //   .moveDown();

//   // Create a table for order items
//   doc
//     .fontSize(12)
//     .text('Order Items:', 50, 220);

//   const tableTop = 250;
//   const tableHeaders = ['Product', 'Quantity', 'Price', 'Subtotal'];
//   const itemHeight = 30;

//   doc
//     .font('Helvetica-Bold')
//     .text(tableHeaders[0], 50, tableTop)
//     .text(tableHeaders[1], 250, tableTop)
//     .text(tableHeaders[2], 350, tableTop)
//     .text(tableHeaders[3], 450, tableTop);

//   order.items.forEach((item, index) => {
//     const yPos = tableTop + (index + 1) * itemHeight;
//     doc
//       .font('Helvetica')
//       .text(item.product.name, 50, yPos)
//       .text(item.quantity.toString(), 250, yPos)
//       .text(`$${item.price.toFixed(2)}`, 350, yPos)
//       .text(`$${(item.price * item.quantity).toFixed(2)}`, 450, yPos);
//   });

//   // Calculate and display the total
//   const totalY = tableTop + (order.items.length + 1) * itemHeight;
//   doc
//     .font('Helvetica-Bold')
//     .text('Total:', 350, totalY)
//     .text(`$${order.totalAmount.toFixed(2)}`, 450, totalY);

//   // End the document and save it to the specified path
//   doc.end();
//   doc.pipe(fs.createWriteStream(path));
// }

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}


function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}

function generateTableRow(
  doc,
  y,
  item,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

exports.generateInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Fetch the order details from MongoDB
    const orders = await Order.findById(orderId)
    .populate('user')
    .populate({
      path: 'address',
      model: 'Address',
    })
    .populate({
      path: 'items.product',
      model: 'Product',
    })

    // Create a new PDF document
    const doc = new PDFDocument();

    // Define the PDF file name
    const fileName = `invoice_${orderId}.pdf`;

    // Set content type and headers for the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Pipe the PDF document to the response stream
    doc.pipe(res);

    // Generate the invoice content
    doc
    .fillColor("#444444")
    .fontSize(20)
    .text("GadgetEase", 110, 57)
    .fontSize(10)
    .text("GadgetEase", 200, 50, { align: "right" })
    .text("682301", 200, 65, { align: "right" })
    .text("Maradu ", 200, 80, { align: "right" })
    .moveDown();

    doc
    .fillColor("#444444")
    .fontSize(20)
    .text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(orders._id, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .text(formatDate(new Date()), 150, customerInformationTop + 15)
    .text("Total Amount :", 50, customerInformationTop + 30)
    .text(
      orders.totalAmount,
      150,
      customerInformationTop + 30
    )

    .font("Helvetica-Bold")
    .text(orders.address.name, 300, customerInformationTop)
    .font("Helvetica")
    .text(orders.address.houseName, 300, customerInformationTop + 15)
    .text(
      orders.address.city +
        ", " +
        orders.address.state +
        ", " +
       'India',
      300,
      customerInformationTop + 30
    )
    .moveDown();

  generateHr(doc, 252);

  const invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Item",
    "Quantity",
    "Line Total",
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

let position = 0;
  for (let i = 0; i < orders.items.length; i++) {
    position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      orders.items[i].product.name,
      orders.items[i].quantity,
      orders.items[i].product.discountPrice,
    );
    generateHr(doc, position + 20)
  }
  doc
  .font("Helvetica-Bold")
  .text("Total:", 50,position + 40)


    doc.end()
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating the invoice');
  }
}