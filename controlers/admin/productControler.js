import Product from '../../models/products.js';
import Category
from "../../models/category.js";


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

const postAddProductPage =
async (req, res) => {

    try {

        const {
            title,
            category,
            author,
            description,
            price,
            quantity,
            status
        } = req.body;

        console.log(req.body);

        const existProduct =
            await Product.findOne({
                title:
                    title.trim()
            });

        if (existProduct) {

            return res.render(
                "admin/addProduct",
                {
                    title:
                        "add products",
                    cssFile:
                        "addProducts.css",
                    error:
                        "Product already exists"
                }
            );
        }

        const newProduct =
            new Product({
                title:
                    title.trim(),
                category,
                author,
                description,
                price,
                quantity,
                status
            });

        await newProduct.save();

        console.log(
            "Product Saved"
        );

        return res.redirect(
            "/admin/products"
        );

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            error:
                error.message
        });
    }
};

export default {
    getProductDashboard,
    getaddProductPage,
    postAddProductPage
}