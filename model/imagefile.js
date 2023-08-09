const { Timestamp } = require('mongodb')
const mongoose = require('mongoose')
const imageSchema = new mongoose.Schema({
    images:{
        type:String,
    }
   
},
{timestamps:true})

const imageModel = mongoose.model('images',imageSchema)
module.exports = imageModel