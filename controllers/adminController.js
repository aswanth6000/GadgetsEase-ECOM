const Product = require('../model/product');
const User = require('../model/user')
const Order = require('../model/order')
const Transaction = require('../model/transaction'); 
const Coupon = require('../model/coupon')
const Address = require('../model/addresses')
const Category = require('../model/category')
exports.adminhome = async (req, res) => {
  try {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const orderCounts = await countOrders(startDate, endDate);
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

    res.render('./adminnew/dashboard-sales', { orders, orderCounts });
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
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.render('./admin/edit-product', { product: product });
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
        path: 'address', // Use the correct path
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

    const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (newStatus === 'refund-initiated') {
      const user = await User.findById(updatedOrder.user);

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
    res.render('./admin/viewCouponUsers', {users});
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

exports.addProduct = async (req, res)=>{
  try {
    const { name, category, price, discountPrice, quantity, productColor, ram, rom, expandable, frontCam, rearCam, processor } = req.body;
    const productImages = req.files['productImages'].map(file => file.filename);
    const video = req.files['video'][0].filename;
    const newProduct = new Product({
      name,
      category,
      price,
      discountPrice,
      quantity,
      productImages,
      video,
      productColor,
      ram,
      rom,
      expandable,
      frontCam,
      rearCam,
      processor,
    });
    await newProduct.save();
    res.redirect('/admin/viewproducts');
  } catch (error) {
    console.error('Error adding product:', error);
  }
}

exports.editProduct = async(req, res)=>{
  try {
    const productId = req.params.productId;
    const { name, category, price, discountPrice, quantity, productColor, ram, rom, expandable, frontCam, rearCam, processor } = req.body;

    // Fetch the product from the database by ID
    const product = await Product.findById(productId);

    // Update product details based on form data
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

    // Handle uploaded product images
    if (req.files['productImages']) {
      const newImages = req.files['productImages'].map(file => file.filename);
      product.productImages = product.productImages.concat(newImages);
    }

    // Handle uploaded product video
    if (req.files['video'] && req.files['video'][0]) {
      product.video = req.files['video'][0].filename;
    }

    // Save the updated product to the database
    await product.save();

    // Redirect to a success page or send a success response
    res.redirect('/admin/viewproducts'); // Replace with your success route
  } catch (err) {
    // Handle errors, e.g., show an error page or send an error response
    console.error('Error editing product:', err);
    res.status(500).send('Internal Server Error'); // Replace with your error handling logic
  }
}
