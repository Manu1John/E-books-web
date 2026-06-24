import express from 'express'
import Products from "../../models/products.js"
import Category from '../../models/category.js'

const getuserIndex = async (req, res) => {
  try {
    if (req.session?.user) {
      return res.redirect("/home");
    }

    const standardLimit = 4;

    // Extract search query parameter
    const searchQuery = req.query.search ? req.query.search.trim() : "";

    // Base query conditions for search
    const searchFilter = searchQuery ? {
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { title: { $regex: searchQuery, $options: "i" } },
        { author: { $regex: searchQuery, $options: "i" } }
      ]
    } : {};

    // ================= 1. POPULAR BOOKS ("ALL" TAB PAGINATION) =================
    const allPage = parseInt(req.query.page_all) || 1;
    const allSkip = (allPage - 1) * standardLimit;

    const allProductsCondition = {
      isDeleted: false,
      status: "active",
      ...searchFilter
    };

    const allProducts = await Products.find(allProductsCondition)
      .populate("category")
      .skip(allSkip)
      .limit(standardLimit);

    const totalAll = await Products.countDocuments(allProductsCondition);
    const allTotalPages = Math.ceil(totalAll / standardLimit) || 1;

    // ================= 2. POPULAR BOOKS (INDIVIDUAL CATEGORY PAGINATION) =================
    const categories = await Category.find({ isDeleted: false });

    const categoryData = await Promise.all(
      categories.map(async (cat) => {
        const page = parseInt(req.query[`page_${cat._id}`]) || 1;
        const skip = (page - 1) * standardLimit;

        const categoryProductsCondition = {
          isDeleted: false,
          status: "active",
          category: cat._id,
          ...searchFilter
        };

        const products = await Products.find(categoryProductsCondition)
          .populate("category")
          .skip(skip)
          .limit(standardLimit);

        const total = await Products.countDocuments(categoryProductsCondition);

        return {
          category: cat,
          products,
          page,
          totalPages: Math.ceil(total / standardLimit) || 1
        };
      })
    );

    // ================= 3. FEATURED BOOKS PAGINATION =================
    const featuredPage = parseInt(req.query.page_featured) || 1;
    const featuredSkip = (featuredPage - 1) * standardLimit;

    const featuredCondition = {
      isDeleted: false,
      status: "active",
      ...searchFilter
    };

    const featuredProducts = await Products.find(featuredCondition)
      .sort({ createdAt: -1 })
      .skip(featuredSkip)
      .limit(standardLimit);

    const totalFeatured = await Products.countDocuments(featuredCondition);
    const featuredTotalPages = Math.ceil(totalFeatured / standardLimit) || 1;

    // ================= 4. SPECIAL OFFERS PAGINATION =================
    const offerPage = parseInt(req.query.page_offer) || 1;
    const offerSkip = (offerPage - 1) * standardLimit;

    const offerCondition = {
      isDeleted: false,
      status: "active",
      ...searchFilter
    };

    const offerProducts = await Products.find(offerCondition)
      .sort({ price: 1 })
      .skip(offerSkip)
      .limit(standardLimit);

    const totalOffers = await Products.countDocuments(offerCondition);
    const offerTotalPages = Math.ceil(totalOffers / standardLimit) || 1;

    // Render the template with all multi-pagination variables
    return res.render("user/index", {
      allProducts,
      allPage,
      allTotalPages,
      categoryData,
      products: featuredProducts,
      featuredPage,
      featuredTotalPages,
      offerProducts,
      offerPage,
      offerTotalPages,
      query: req.query 
    });

  } catch (error) {
    console.error("GET USER INDEX ERROR:", error);
    return res.redirect("/");
  }
};

const getHome = async (req, res, next) => {
  try {
    // Safe check: Prevent unauthorized access if the session is uninitialized
    if (!req.session?.user) {
      return res.redirect("/");
    }

    const standardLimit = 4;

    // Extract search query parameter
    const searchQuery = req.query.search ? req.query.search.trim() : "";

    // Base query conditions for search
    const searchFilter = searchQuery ? {
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { title: { $regex: searchQuery, $options: "i" } },
        { author: { $regex: searchQuery, $options: "i" } }
      ]
    } : {};

    // ================= 1. POPULAR BOOKS ("ALL GENRE" PAGINATION) =================
    const allPage = parseInt(req.query.page_all) || 1;
    const allSkip = (allPage - 1) * standardLimit;

    const allProductsCondition = {
      isDeleted: false,
      status: "active",
      ...searchFilter
    };

    const allProducts = await Products.find(allProductsCondition)
      .populate("category")
      .skip(allSkip)
      .limit(standardLimit);

    const totalAll = await Products.countDocuments(allProductsCondition);
    const allTotalPages = Math.ceil(totalAll / standardLimit) || 1;

    // ================= 2. POPULAR BOOKS (CATEGORY WISE PAGINATION) =================
    const categories = await Category.find({ isDeleted: false });

    const categoryData = await Promise.all(
      categories.map(async (cat) => {
        const page = parseInt(req.query[`page_${cat._id}`]) || 1;
        const skip = (page - 1) * standardLimit;

        const categoryProductsCondition = {
          isDeleted: false,
          status: "active",
          category: cat._id,
          ...searchFilter
        };

        const products = await Products.find(categoryProductsCondition)
          .populate("category")
          .skip(skip)
          .limit(standardLimit);

        const total = await Products.countDocuments(categoryProductsCondition);

        return {
          category: cat,
          products,
          page,
          totalPages: Math.ceil(total / standardLimit) || 1
        };
      })
    );

    // ================= 3. FEATURED BOOKS PAGINATION =================
    const featuredPage = parseInt(req.query.page_featured) || 1;
    const featuredSkip = (featuredPage - 1) * standardLimit;

    const featuredCondition = {
      isDeleted: false,
      status: "active",
      ...searchFilter
    };

    const featuredProducts = await Products.find(featuredCondition)
      .sort({ createdAt: -1 })
      .skip(featuredSkip)
      .limit(standardLimit);

    const totalFeatured = await Products.countDocuments(featuredCondition);
    const featuredTotalPages = Math.ceil(totalFeatured / standardLimit) || 1;

    // ================= 4. SPECIAL OFFERS PAGINATION =================
    const offerPage = parseInt(req.query.page_offer) || 1;
    const offerSkip = (offerPage - 1) * standardLimit;

    const offerCondition = {
      isDeleted: false,
      status: "active",
      ...searchFilter
    };

    const offerProducts = await Products.find(offerCondition)
      .sort({ price: 1 })
      .skip(offerSkip)
      .limit(standardLimit);

    const totalOffers = await Products.countDocuments(offerCondition);
    const offerTotalPages = Math.ceil(totalOffers / standardLimit) || 1;

    // Render the logged-in home context while passing all isolated multi-pagination metrics
    return res.render("user/home", {
      user: req.session.user,
      allProducts,
      allPage,
      allTotalPages,
      categoryData,
      products: featuredProducts,
      featuredPage,
      featuredTotalPages,
      offerProducts,
      offerPage,
      offerTotalPages,
      query: req.query 
    });

  } catch (error) {
    // Log the error for server-side debugging
    console.error("Error in getHome controller:", error);
    
    // Forward the error to your central Express error-handling middleware
    next(error);
  }
};

export default {
    getuserIndex,
    getHome
}