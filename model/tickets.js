const { Timestamp } = require('mongodb')
const mongoose = require('mongoose')

const ticketSchema = new mongoose.Schema({
    isUser:{
        type:String,
        required:true
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:  function() {
            return this.isUser === 'user' ? 'users' : 'clubs';
        }
    },
    match:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'matches'
    },
    tickets:[{
      no:{
        type:String,
        required:true
      },
      status:{
        type:Boolean,
        default:false
      }
    }]
},
{timestamps:true})

  
const ticketModel = mongoose.model('tickets',ticketSchema)
module.exports = ticketModel