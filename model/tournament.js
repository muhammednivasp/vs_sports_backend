const { Timestamp } = require('mongodb')
const mongoose = require('mongoose')

const tournamentSchema = new mongoose.Schema({
    tournamentname:{
        type:String,
        required:true
    },
    location:{
        type:String,
        required:true
    },
    club:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'clubs'
    },
    tournamenttype:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        default:true
    },
    announced:{
        type:Boolean,
        default:false
    },
    announcedid:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'announceTournament'
    },
    block:{
        type:Boolean,
        default:false
    },
    winners:{
        type:String
    },
    runners:{
       type:String
    }

},
{timestamps:true})

const tournamentModel = mongoose.model('tournament',tournamentSchema)
module.exports = tournamentModel