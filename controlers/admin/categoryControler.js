import Category from "../../models/category.js"

const  getCategoryDashboard =async (req,res)=>{
    try{
        const page =parseInt(req.query.page)||1
        const limit = 4
        const skip = (page-1)*limit
        const categoryData = await Category.find({})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
        const totalCategories = await Category.countDocuments()
        const totalPages = Math.ceil(totalCategories/limit)
         return res.render("admin/category",{
                    title:
                    "category management",
                cssFile:
                    "category.css",
                jsFile:
                    "category.js",

                    cat:categoryData,
                    currentPage:page,
                    totalPages,
                    totalCategories


        })
    }catch(error){
        console.log("get category dashboard error",error)
        return res.status(500).send("something went wrong")
    }
}

const getAddCategory = async(req,res)=>{
    try {
        return res.render("admin/addCategory",{
            title:"add category",
            cssFile:"addCategory.css",
            jsFile:"addCategory.js"
        })
    } catch (error) {
       return res.status(400).json({error:"Cant access category page "})
    }
}

const addCategory = async (req,res)=>{
    try {
        const {name,description,status} = req.body
        const existingCategory = await Category.findOne({name:name.trim()})
        if(existingCategory){
            return res.render('admin/addCategory',{
             title:"category management",
            cssFile:"addCategory.css",
            jsFile:"addCategory.js",
            error:"category already exitst"
            })
        }

        const newCategory = new Category({
            name:name.trim(),
            description,
            status,
        })

       await newCategory.save()
       return res.redirect("/admin/category");
    

    } catch (error) {
        return res.status(500).json({error:"Internal server error"})
    }
}


export default{
    getCategoryDashboard,
    getAddCategory,
    addCategory
}