const Product = require('../model/product');
const User = require('../model/user')

exports.adminhome = (req, res) => {
    User.find()
    .populate('orders.userDetails') 
    .exec()
    .then((users) => {
      if (!users) {
        return res.status(404).json({ error: 'Users not found.' });
      }
        const orders = users.flatMap(user => user.orders);
      res.render('./admin/admin-dash', { orders });
    })
    .catch((err) => {
      console.error('Error fetching user orders:', err);
      res.status(500).json({ error: 'An error occurred while fetching user orders.' });
    });
}


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
    const user = await User.find()
    res.render('./admin/viewUser',{user});
}

exports.blockuser = async (req, res) => {
    const userId = req.params.userId;
  
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
            products = await Product.find(); // Fetch all products
        }

        // Render an HTML template with the filtered products
        res.render('./admin/view-products', { products }); // Replace 'your_template' with the actual template name
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

exports.getAddProducts = (req, res) => {
    res.render('./admin/product-upload');
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
exports.orderDetails = async (req, res) => {
    try {
      const orderId = req.params.orderId;

      const user = await User.findOne({ 'orders._id': orderId })
        .populate({
          path: 'orders.product',
          model: 'Product', // Adjust the model name as needed
        });
  
      if (!user) {
        return res.status(404).json({ error: 'Order not found.' });
      }
  
      // Find the specific order by order ID
      const order = user.orders.find((order) => order._id.toString() === orderId);
  
      // Render the order-details.ejs template with the order details
      res.render('./admin/orderDetails', { order });
    } catch (error) {
      console.error('Error fetching order details:', error);
      res.status(500).json({ error: 'An error occurred while fetching order details.' });
    }
}
    exports.postOrderDetails = async (req, res) => {
        try {
          const orderId = req.params.orderId;
          const newStatus = req.body.orderStatus;
      
          // Find the user document that contains the order by order ID
          const user = await User.findOne({ 'orders._id': orderId });
      
          if (!user) {
            return res.status(404).json({ error: 'Order not found.' });
          }
      
          // Find and update the specific order by order ID
          const order = user.orders.find((order) => order._id.toString() === orderId);
      
          if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
          }
      
          // Update the order status
          order.status = newStatus;
          
          // Save the user document with the updated order status
          await user.save();
      
          // Redirect to the order details page or any other appropriate page
          res.redirect(`/adminhome`); 
        }catch(error){
            console.log("er4ror while updating the order status",error)
        }
    }