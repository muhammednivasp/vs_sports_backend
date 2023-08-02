const { Timestamp } = require('mongodb')
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phonenumber:{
        type:Number,
    },
    password:{
        type:String,
        required:true
    },
    isUser:{
       type:String,
       required:true
    },
    isGoogle:{
        type:Boolean,
        default:false
    },
    verified:{
        type:Boolean,
        default:false,
    }
},
{timestamps:true})

const userModel = mongoose.model('users',userSchema)
module.exports = userModel