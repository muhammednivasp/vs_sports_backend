const { Timestamp } = require('mongodb')
const mongoose = require('mongoose')

const matchSchema = new mongoose.Schema({
    matchnumber:{
        type:String,
        required:true
    },
    date:{
        type:Date
    },
    time:{
        type:Date
    },
    firstteam:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teams'
    },
    secondteam:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teams'
    },
    matchstatus:{
        type:Boolean
    },
    tournament:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tournament',
    },
    results:{
        firstteamscore:{
            type:Number
        },
        firstteamscorers:[{
            type:String
        }],
        secondteamscore:{
            type:Number
        },
        secondteamscorers:[{
            type:String
        }]
    },
    ticketstatus:{
        type:Boolean
    }
},
{timestamps:true})

const matchModel = mongoose.model('matches',matchSchema)
module.exports = matchModel