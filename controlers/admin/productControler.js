import Product from '../../models/products.js';
import Category
from "../../models/category.js";
import productService from '../../services/productService.js';
import fs from 'fs'
const getProductDashboard =
async (req, res) => {

    try {

        const page =
            parseInt(req.query.page) || 1;

        const limit = 4;

        const skip =
            (page - 1) * limit;

        const search =
            req.query.search?.trim() || "";

        // BASE QUERY
        const query = {
            isDeleted: false
        };

        // SEARCH
        if (search) {

            query.title = {
                $regex: search,
                $options: "i"
            };
        }


        // GET PRODUCTS
        const productData =
            await Product.find(query)

                // POPULATE CATEGORY
                .populate("category")

                .sort({
                    createdAt: -1
                })

                .skip(skip)

                .limit(limit);


        // COUNT PRODUCTS
        const totalProducts =
            await Product.countDocuments(
                query
            );


        // TOTAL PAGES
        const totalPages =
            Math.ceil(
                totalProducts / limit
            );


        // RENDER PAGE
        return res.render(
            "admin/products",
            {
                title:
                    "Product Page",

                cssFile:
                    "products.css",

                jsFile:
                    "products.js",

                pro:
                    productData,

                totalProducts,

                totalPages,

                currentPage:
                    page,

                search
            }
        );

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            error:
                error.message
        });
    }
};

const getaddProductPage =
async (req,res)=>{

    try{

        const categories =
            await Category.find({
                isDeleted:false
            });

        return res.render(
            "admin/addProduct",
            {
                title:
                    "add products",
                cssFile:
                    "addProducts.css",
                jsFile:
                    "addProdcuts.js",
                categories
            }
        );

    }catch(error){

        console.log(error);

        res.status(500).json({
            error:error.message
        });
    }
}
const postAddProductPage = async (req, res) => {
    try {
        // 1. Pass the form body data and Multer files to your service layer
        await productService.createProduct(req.body, req.files);
        
        console.log("Product Saved Successfully!");

        // 2. Since frontend always uses fetch(), ALWAYS reply with clean JSON
        return res.status(200).json({ 
            success: true, 
            redirectUrl: "/admin/products" 
        });

    } catch (error) {
        console.error("Backend Error caught in controller:", error.message);
        
        // 3. File Cleanup: Delete files Multer just saved so they don't clutter your disk
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error("Error clearing orphan file during crash:", err);
                });
            });
        }

        // 4. Send the clean error message directly back to the frontend fetch script
        return res.status(400).json({ error: error.message });
    }
};



export default {
    getProductDashboard,
    getaddProductPage,
    postAddProductPage
}