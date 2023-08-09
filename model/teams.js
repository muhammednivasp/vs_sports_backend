const { Timestamp } = require('mongodb')
const mongoose = require('mongoose')

const teamSchema = new mongoose.Schema({
    teamname:{
        type:String,
        required:true
    },
    location:{
        type:String,
        required:true
    },
    phonenumber:{
        type:Number,
        required:true
    },
    registration:{
        type:Number,
        required:true
    },
    announcementid:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'announceTournament'
    },
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
    amount:{
        type:Number,
        required:true
    },
    tournament:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tournament'
    },
    manualAdd:{
        type:Boolean,
        default:false
    }
   
},
{timestamps:true})

const teamModel = mongoose.model('teams',teamSchema)
module.exports = teamModel