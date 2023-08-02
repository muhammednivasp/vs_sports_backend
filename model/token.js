const mongoose = require("mongoose")
const { Schema } = mongoose;

const tokenSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"user",
        unique:true,
    },
    token:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires:3600
    }
},{timestamps:true})

module.exports = mongoose.model("token",tokenSchema)