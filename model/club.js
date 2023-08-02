const { Timestamp } = require('mongodb')
const mongoose = require('mongoose')

const clubSchema = new mongoose.Schema({
    clubname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    registration:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    isUser:{
       type:String,
       required:true
    },
    location:{
        type:String,
        required:true
    },
    verified:{
        type:Boolean,
        default:false,
    }
},
{timestamps:true})

const clubModel = mongoose.model('clubs',clubSchema)
module.exports = clubModel