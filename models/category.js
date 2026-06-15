import mongoose from 'mongoose'

const categorySchema= new mongoose.Schema({
    name : {
        type :String,
        required:true,
        unique:true
    },
    
    description:{
        type:String,
    },
       status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },

},
{
    timestamps: true
})

const Category = mongoose.model("category",categorySchema)

export default Category