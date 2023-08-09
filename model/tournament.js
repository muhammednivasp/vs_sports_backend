const { Timestamp } = require('mongodb')
const mongoose = require('mongoose')

const tournamentSchema = new mongoose.Schema({
    tournamentname:{
        type:String,
        required:true
    },
    // clubid:{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'clubs',
    // },
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
    }


},
{timestamps:true})

const tournamentModel = mongoose.model('tournament',tournamentSchema)
module.exports = tournamentModel