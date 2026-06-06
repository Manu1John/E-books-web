
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({

    firstName:{
        type:String,
        required:true,
       
    },
    lastName:{
        type:String,
        required:true,
        
    },
    password:{
        type:String,
        required:true,
        
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
        isBlocked: {
        type: Boolean,
        default: false
    }
},
{
    timestamps: true
}
)

const User =  mongoose.model("UserAuthentication",userSchema)
export default User