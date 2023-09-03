const Product = require('../model/product');

exports.adminhome = (req, res) => {
    res.render('./admin/admin-dash');
}

exports.viewuser = (req, res) => {
    res.render('./admin/viewUser');
}

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
        // Find the product by ID and remove it from the database
        const deletedProduct = await Product.findByIdAndRemove(productId);

        if (!deletedProduct) {
            return res.status(404).send('Product not found');
        }

        res.redirect('/admin/viewproducts'); // Redirect to a page after successful deletion
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('Internal Server Error');
    }
}