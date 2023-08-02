const { Timestamp, ObjectId } = require('mongodb')
const mongoose = require('mongoose')

const announcetournamentSchema = new mongoose.Schema({
    tournamentname:{
        type:String,
        required:true
    },
    location:{
        type:String,
        required:true
    },
    teamsrequired:{
        type:Number,
        required:true
    },
    fee:{
        type:Number,
        required:true
    },
    lastdate:{
        type:Date,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    club:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'clubs',
    },
    added:{
        type:Boolean,
        default:false
    }
},
{timestamps:true})

const announceTournamentModel = mongoose.model('announceTournament',announcetournamentSchema)
module.exports = announceTournamentModel