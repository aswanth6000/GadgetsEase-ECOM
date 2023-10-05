const Product = require('../model/product');
const User = require('../model/user')
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig')
const path = require('path');
require('dotenv').config();
const Order = require('../model/order')
const Transaction = require('../model/transaction'); 
const Coupon = require('../model/coupon')
const Address = require('../model/addresses')
const functionHelper = require('../helpers/functionHelper')
const Category = require('../model/category')
const Ticket = require('../model/ticket')
const paginate = require('mongoose-paginate-v2');
const PDFDocument = require('pdfkit')
const  {formatDate, generateHr, generateTableRow, generateTableRowSales}  = require("../helpers/createInvoice");

async function calculateDailyOrderCounts(startDate, endDate) {
  try {
    const dailyOrderCounts = [];

    // Loop through each day in the date range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Calculate the next day
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      // Query the database to count orders for the current day
      const orderCount = await Order.countDocuments({
        orderDate: { $gte: currentDate, $lt: nextDate },
      });

      // Push the daily order count to the result array
      dailyOrderCounts.push({
        date: currentDate.toISOString(), // Store date in ISO format
        count: orderCount,
      });

      // Move to the next day
      currentDate = nextDate;
    }

    return dailyOrderCounts;
  } catch (error) {
    throw error;
  }
}

exports.adminhome = async (req, res) => {
  try {
    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const endDatee = new Date();

    (async () => {
      try {
        const historicalData = await Order.aggregate([
          {
            $match: {
              orderDate: {
                $gte: startDate,
                $lte: endDatee,
              },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$orderDate' },
                month: { $month: '$orderDate' },
                day: { $dayOfMonth: '$orderDate' },
              },
              count: { $sum: 1 }, // Count orders per day
            },
          },
          {
            $project: {
              _id: 0, // Exclude the _id field from the result
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                },
              },
              count: 1,
            },
          },
          {
            $sort: { date: 1 }, // Sort by date in ascending order
          },
        ]).exec();

        // Use historicalData for your chart or other purposes

        // Now that you have historicalData, render the view here
        const orderCounts = await countOrders(startDate, endDate);
        const dailyOrderData = await calculateDailyOrderCounts(startDate, endDate);

        const orders = await Order.find()
          .populate('user')
          .populate({
            path: 'address', // Use the correct path
            model: 'Address',
          })
          .populate({
            path: 'items.product',
            model: 'Product',
          })
          .sort({ orderDate: -1 });

        const categoryOrderCounts = await Order.aggregate([
          {
            $unwind: '$items',
          },
          {
            $lookup: {
              from: 'products', // Name of the products collection
              localField: 'items.product',
              foreignField: '_id',
              as: 'product',
            },
          },
          {
            $unwind: '$product',
          },
          {
            $group: {
              _id: '$product.category', // Group by category
              count: { $sum: 1 }, // Count orders per category
            },
          },
        ]);
        const averageOrderCount = orderCounts.thisMonthOrders / 30;

        // Render the view with all the data
        res.render('./adminnew/dashboard-sales', {
          orders,
          orderCounts,
          dailyOrderData,
          categoryOrderCounts,
          averageOrderCount,
          historicalData,
        });
      } catch (error) {
        console.error('Error inside async IIFE:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    })();
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.getUsersCount = async (req, res) => {
    try{
        
        const totalUsersCount = await User.countDocuments();
        const activeUsersCount = await User.countDocuments({ status: 'active' });
        const blockedUsersCount = await User.countDocuments({ status: 'block' });

        res.json({
            totalUsersCount,
            activeUsersCount,
            blockedUsersCount,
        });
    }catch{
        console.log('Error');
    }
}


exports.viewUser = async (req,res)=>{
    const user = await User.find().sort({ createdDate: -1 });
    res.render('./adminnew/viewUsers',{user});
}

exports.blockuser = async (req, res) => {
    const userId = req.params.userId;
    if(req.session.user){
      res.session.user.status = 'blocked'
    }
    await User.findByIdAndUpdate(userId, { status: 'blocked' })
      .then(() => {
        res.redirect('/admin/viewuser');
      })
      .catch((error) => {
        console.error('Error blocking user:', error);
        res.status(500).send('Internal Server Error');
      });
  };

exports.unblockuser = async (req, res) => {
    const userId = req.params.userId;
    if(req.session.user){
      res.session.user.status = 'active'
    }
    await User.findByIdAndUpdate(userId, { status: 'active' })
      .then(() => {
        res.redirect('/admin/viewuser');
      })
      .catch((error) => {
        console.error('Error UnBlocking user:', error);
        res.status(500).send('Internal Server Error');
      });
  };
exports.viewproducts = async (req, res) => {
    const filter = req.query.filter; // Get the filter value from the query parameter
    
    try {
        let products;
    
        // Fetch products based on the selected filter
        if (filter === 'inStock') {
            products = await Product.find({ quantity: { $gt: 0 } }); // Fetch products with quantity > 0
        } else if (filter === 'outOfStock') {
            products = await Product.find({ quantity: { $lte: 0 } }); // Fetch products with quantity <= 0
        } else {
            products = await Product.find().sort({ orderDate: -1 });; // Fetch all products
        }

        // Render an HTML template with the filtered products
        res.render('./adminnew/view-products', { products }); // Replace 'your_template' with the actual template name
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

exports.getProductCount = async (req, res) => {
    try {
        const totalProductsCount = await Product.countDocuments();
        const inStockProductsCount = await Product.countDocuments({ quantity: { $gt: 0 } });
        const outOfStockProductsCount = await Product.countDocuments({ quantity: { $lte: 0 } });

        res.json({
            totalProductsCount,
            inStockProductsCount,
            outOfStockProductsCount,
        });
    } catch (error) {
        console.error('Error fetching product counts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAddProducts = async(req, res) => {
  const categorys = await Category.find()
    res.render('./admin/product-upload',{categorys});
}

exports.geteditProducts = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);
        const categories  =await Category.find();
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.render('./admin/edit-product', { product: product, categories });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteProduct = async (req, res) => {
    const productId = req.params.productId;
    try {
        const deletedProduct = await Product.findByIdAndRemove(productId);
        if (!deletedProduct) {
            return res.status(404).send('Product not found');
        }
        res.redirect('/admin/viewproducts');
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function countOrders(startDate, endDate) {
  try {
    const todayOrders = await Order.countDocuments({
      orderDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const thisMonthOrders = await Order.countDocuments({
      orderDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const totalOrders = await Order.countDocuments();

    return {
      todayOrders,
      thisMonthOrders,
      totalOrders,
    };
  } catch (error) {
    console.error('Error counting orders:', error);
    throw error;
  }
}

exports.orderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
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
      .sort({ orderDate: -1 });
    res.render('./admin/orderDetails', { orders});
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.postOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const newStatus = req.body.orderStatus;
    const order = await Order.findById(orderId)
    const userId = order.user

    const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });
    if(newStatus === 'delivered'){
      const deliveryDate = await Order.findByIdAndUpdate(orderId, {deliveryDate : Date.now()}, { new: true})
    }

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (newStatus === 'refund-initiated') {
      const user = await User.findById(updatedOrder.user);

      for (const item of updatedOrder.items) {
        const product = await Product.findById(item.product);

        // Increase the product quantity by the item quantity
        product.quantity += item.quantity;

        // Save the updated product information
        await product.save();
      }

      // Calculate the total refund amount based on the items in the order
      const refundAmount = updatedOrder.items.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      // Add the refund amount to the user's wallet balance
      user.walletBalance += refundAmount;

      // Save the updated user information
      await user.save();

      // Create a transaction record for the refund
      const transaction = new Transaction({
        user: user._id,
        type: 'credit',
        amount: refundAmount,
        description: 'Refund for order ID: ' + orderId,
      });

      // Save the transaction record
      await transaction.save();
    }
    const user = await User.findById(userId)
    const userName = user.username;
    const userEmail = user.email
    functionHelper.sendOrderStatusEmail(userName, orderId, newStatus, userEmail);

    // Redirect to the admin dashboard or any other appropriate page
    res.redirect(`/adminhome`);
  } catch (error) {
    console.error('Error while updating the order status', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const categorys = await Category.find()
    res.render('./adminnew/viewCategory', { categorys });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.listCategory = async (req, res) => {
  const categoryp = req.params.category;
  try {
    const products = await Product.find({ category: categoryp });
    res.render('./admin/listCategory', { category: categoryp, products });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send('Internal Server Error');
  }
};

exports.viewCoupon =async (req, res)=>{
  try{
    const coupons = await Coupon.find()
    res.render('./adminnew/viewCoupon',{coupons})
  }catch(err){
    console.log("Error occoured while fetching coupons", err);
  }
}
exports.getCoupon = (req, res)=>{
  res.render('./admin/couponAdd')
}

exports.postAddCoupon = async (req, res) =>{
  const {couponCode, discount, expiryDate, limit, DiscountType} = req.body;
  try{
    const newCoupon = new Coupon ({
      code : couponCode,
      discount : discount,
      limit : limit,
      type : DiscountType,
      expiry : expiryDate
    })
    await Coupon.insertMany(newCoupon);
    res.redirect('/viewCoupon')
  }catch(err){
    console.log("Error adding coupon", err);
  }
}
exports.viewCouponUsedUsers = async (req, res)=>{
  try{
    const couponId = req.params.couponId;
    const coupon = await Coupon.findById(couponId)
    .populate('usersUsed') 
    .sort({ _id: -1 })
    .exec();    
    const users = coupon.usersUsed;
    res.render('./admin/viewCouponUsers', {users, coupon});
  }catch(err){
    console.log("Error finding the coupon code", err);
  } 
}

exports.getAddCategory = (req, res) =>{
  res.render('./admin/addCategory');
}

exports.postaddCategory = (req, res) =>{
  const {addcategory} = req.body;
  const newCategory = new Category({
    category : addcategory
  })
  newCategory.save()
  .then(()=>{
    res.redirect('/viewcategory')
  })
  .catch((err)=>{
    console.log("Error occoured adding category", err);
  })

}

exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      discountPrice,
      quantity,
      productColor,
      ram,
      rom,
      expandable,
      frontCam,
      rearCam,
      processor,
    } = req.body;

    const files = req.files;
    const folderName = 'GadgetEaseUploads';
    const productImages = await Promise.all(files.map(async (file) => {
      const result = await cloudinary.uploader.upload(file.path,  { public_id: `${folderName}/${file.originalname}`});
      return {
        secure_url: result.secure_url,
        cloudinary_id: result.public_id
      };
    }));
    // Create a new Product document with the extracted data
    const newProduct = new Product({
      name,
      category,
      price,
      discountPrice,
      quantity,
      productImages,
      productColor,
      ram,
      rom,
      expandable,
      frontCam,
      rearCam,
      processor,
    });

    // Save the new product to the database
    await newProduct.save();

    // Redirect to a success page or any other appropriate action
    res.redirect('/admin/viewproducts');
  } catch (error) {
    console.error('Error adding product:', error);
    // Handle errors appropriately, e.g., send an error response
    res.status(500).json({ error: 'Internal server error' });
  }
};
exports.editProduct = async(req, res)=>{
  try {
    const productId = req.params.productId;
    const { name, category, price, discountPrice, quantity, productColor, ram, rom, expandable, frontCam, rearCam, processor } = req.body;

    const product = await Product.findById(productId);

    product.name = name;
    product.category = category;
    product.price = price;
    product.discountPrice = discountPrice;
    product.quantity = quantity;
    product.productColor = productColor;
    product.ram = ram;
    product.rom = rom;
    product.expandable = expandable;
    product.frontCam = frontCam;
    product.rearCam = rearCam;
    product.processor = processor;

    if (req.files['productImages']) {
      const files = req.files;
      const folderName = 'GadgetEaseUploads';
      const newImages = await Promise.all(files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path,  { public_id: `${folderName}/${file.originalname}`});
        return {
          secure_url: result.secure_url,
          cloudinary_id: result.public_id
        };
      }));
      product.productImages = product.productImages.concat(newImages);
    }
    await product.save();

    res.redirect('/admin/viewproducts'); 
  } catch (err) {
    console.error('Error editing product:', err);
    res.status(500).send('Internal Server Error'); 
  }
}

exports.getTickets = async (req, res)=>{
  try{
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    const inProgressTicket = await Ticket.countDocuments({status : 'In Progress'});
    const closedTicket = await Ticket.countDocuments({status : 'Closed'});
    const openTicket = await Ticket.countDocuments({status : 'Open'});
    const ticketCounts = ({
      inProgress : inProgressTicket,
      closed : closedTicket,
      open : openTicket 
    })
    res.render('./adminnew/support-tickets', {tickets, ticketCounts})
  }catch(err){
    console.log("Error while getting tickets",err);
  }
}

exports.getviewticketdetails = async (req, res)=>{
  const ticketId = req.params.ticketId;
  try{
    const ticketDetails = await Ticket.findById(ticketId).populate('user')
    res.render('./adminnew/view-support-tickets', {ticketDetails})
  }catch(err){
    console.log("Error while fetching ticket", err);
  }
}

exports.editTicketStatus = async (req, res)=>{
  try{
    const {ticketId, newStatus} = req.body;
    console.log("99999999999999",ticketId);
    const updateTicket = await Ticket.findByIdAndUpdate(ticketId,
      {status : newStatus, updatedAt : Date.now()},
      {new : true}
    )
    if(!updateTicket){
      console.log("ticket not found");
    }
    res.json(updateTicket)
  }catch(err){
    console.log("Error while updating edit status : ", err);
  }
}

exports.ticketcount = async (req, res)=>{
  const inProgressTicket = await Ticket.countDocuments({status : 'In Progress'});
  const closedTicket = await Ticket.countDocuments({status : 'Closed'});
  const openTicket = await Ticket.countDocuments({status : 'Open'});
  const ticketCounts = [
    {label : "progressTicket", value : inProgressTicket},
    {label : "closed", value : closedTicket},
    {label : "open" , value: openTicket}
  ];
  res.json(ticketCounts)
}

exports.salesReport = async (req, res) => {
  const { dateF, dateL, type } = req.body;
  try {
    const dateFirst = new Date(dateF);
    const dateLast = new Date(dateL);
    if (type === 'sales report') {
      const salesData = await Order.find({
        orderDate: {
          $gte: dateFirst,
          $lte: dateLast,
        },
      })
        .populate('user')
        .populate({
          path: 'address',
          model: 'Address',
        })
        .populate({
          path: 'items.product',
          model: 'Product',
        });
      const salesCount = await Order.countDocuments({
        orderDate: {
          $gte: dateFirst,
          $lte: dateLast,
        }
      });
      console.log(salesData.length);
      const doc = new PDFDocument();

      const fileName = `Sales report on_${dateF} to ${dateL}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      doc.pipe(res);

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
        .text("Sales Report", 50, 160);

      generateHr(doc, 185);

      const customerInformationTop = 200;

      doc
        .fontSize(10)
        .text("Report Type", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text("Sales Report", 150, customerInformationTop)
        .font("Helvetica")
        .text("Generated date", 50, customerInformationTop + 15)
        .text(formatDate(new Date()), 150, customerInformationTop + 15)
        .text("Total Sales :", 50, customerInformationTop + 30)
        .text(
          salesCount,
          150,
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
        "User Id",
        "Purchase date",
        "Line Total",
      );
      generateHr(doc, invoiceTableTop + 20);
      doc.font("Helvetica");

      let position = invoiceTableTop;

      for (let i = 0; i < salesData.length; i++) {
        for (const item of salesData[i].items) {
          if (position >= 700) {
            doc.addPage(); // Add a new page when the content exceeds the current page
            position = invoiceTableTop;
            generateTableRowSales(
              doc,
              position,
              "Item",
              "Quantity",
              "User Id",
              "Purchase date",
              "Line Total",
            );
            generateHr(doc, position + 20);
            doc.font("Helvetica");
          }
          position += 30;
          generateTableRowSales(
            doc,
            position,
            item.product.name,
            item.quantity,
            salesData[i].user.username,
            salesData[i].orderDate.toLocaleDateString(),
            item.product.discountPrice,
          );
          generateHr(doc, position + 20);
        }
      }

      doc
        .font("Helvetica-Bold")
        .text("Total (with coupon discount):", 50, position + 40);
      doc
        .font("Helvetica-Bold")
        .text("22222", 50, position + 40, { align: "right" });

      doc.end();
      console.log("pdf generated");
    } 
    //---------------------------------------------------------------------------------------------------
    else if (type === 'cancel report') {
      const salesData = await Order.find({
        orderDate: {
          $gte: dateFirst,
          $lte: dateLast,
        },
        status: 'cancelled',
      })
        .populate('user')
        .populate({
          path: 'address',
          model: 'Address',
        })
        .populate({
          path: 'items.product',
          model: 'Product',
        });
      const salesCount = await Order.countDocuments({
        orderDate: {
          $gte: dateFirst,
          $lte: dateLast,
        },
        status: 'cancelled',
      });
      const doc = new PDFDocument();

      const fileName = `Cancel report on_${dateF} to ${dateL}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      doc.pipe(res);

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
        .text("Cancel Report", 50, 160);

      generateHr(doc, 185);

      const customerInformationTop = 200;

      doc
        .fontSize(10)
        .text("Report Type", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text("Sales Report", 150, customerInformationTop)
        .font("Helvetica")
        .text("Generated date", 50, customerInformationTop + 15)
        .text(formatDate(new Date()), 150, customerInformationTop + 15)
        .text("Total Cancel :", 50, customerInformationTop + 30)
        .text(
          salesCount,
          150,
          customerInformationTop + 30
        )
        .moveDown();

      generateHr(doc, 252);

      const invoiceTableTop = 330;

      doc.font("Helvetica-Bold");
      generateTableRowSales(
        doc,
        invoiceTableTop,
        "Item",
        "Quantity",
        "User Id",
        "Purchase date",
        "Line Total",
      );
      generateHr(doc, invoiceTableTop + 20);
      doc.font("Helvetica");

      let position = invoiceTableTop;

      for (let i = 0; i < salesData.length; i++) {
        for (const item of salesData[i].items) {
          if (position >= 700) {
            doc.addPage(); // Add a new page when the content exceeds the current page
            position = invoiceTableTop;
            generateTableRow(
              doc,
              position,
              "Item",
              "Quantity",
              "User Id",
              "Purchase date",
              "Line Total",
            );
            generateHr(doc, position + 20);
            doc.font("Helvetica");
          }
          position += 30;
          generateTableRowSales(
            doc,
            position,
            item.product.name,
            item.quantity,
            salesData[i].user.username,
            salesData[i].orderDate.toLocaleDateString(),
            item.product.discountPrice,
          );
          generateHr(doc, position + 20);
        }
      }


      doc.end();
      console.log("pdf generated");
    } else {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const salesData = await Order.find({
        orderDate: {
          $gte: dateFirst,
          $lte: dateLast,
        },  
        deliveryDate: {
          $lt: sevenDaysAgo,
        },
      })
        .populate('user')
        .populate({
          path: 'address',
          model: 'Address',
        })
        .populate({
          path: 'items.product',
          model: 'Product',
        });
      const salesCount = await Order.countDocuments({
        orderDate: {
          $gte: dateFirst,
          $lte: dateLast,
        }
      });
      const doc = new PDFDocument();

      const fileName = `Sales report on_${dateF} to ${dateL}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      doc.pipe(res);

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
        .text("Sales Report", 50, 160);

      generateHr(doc, 185);

      const customerInformationTop = 200;

      doc
        .fontSize(10)
        .text("Report Type", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text("Sales Report", 150, customerInformationTop)
        .font("Helvetica")
        .text("Generated date", 50, customerInformationTop + 15)
        .text(formatDate(new Date()), 150, customerInformationTop + 15)
        .text("Total revenue :", 50, customerInformationTop + 30)
        .text(
          salesCount,
          150,
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
        "User Id",
        "Purchase date",
        "Line Total",
      );
      generateHr(doc, invoiceTableTop + 20);
      doc.font("Helvetica");

      let position = invoiceTableTop;
      let totalRevenue = 0;
      for (let i = 0; i < salesData.length; i++) {
        for (const item of salesData[i].items) {
          if (position >= 700) {
            doc.addPage(); // Add a new page when the content exceeds the current page
            position = invoiceTableTop;
            generateTableRowSales(
              doc,
              position,
              "Item",
              "Quantity",
              "User Id",
              "Purchase date",
              "Line Total",
            );
            generateHr(doc, position + 20);
            doc.font("Helvetica");
          }
          position += 30;
          generateTableRowSales(
            doc,
            position,
            item.product.name,
            item.quantity,
            salesData[i].user.username,
            salesData[i].orderDate.toLocaleDateString(),
            item.product.discountPrice,
          );
          generateHr(doc, position + 20);
          totalRevenue += item.product.discountPrice;
        }
      }

      doc
        .font("Helvetica-Bold")
        .text("Total (with coupon discount):", 50, position + 40);
      doc
        .font("Helvetica-Bold")
        .text("totalRevenue", 50, position + 40, { align: "right" });

      doc.end();
      console.log("pdf generated");
    }
  } catch (err) {
    console.log("Error while creating report", err);
  }
}