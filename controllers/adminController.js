
const adminModel = require('../model/admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const clubModel = require('../model/club');
const userModel = require('../model/user')
const Tournament = require('../model/tournament')
const Match = require('../model/matches')


require('dotenv').config();

module.exports = {
  Login: async (req, res) => {
    try {
      const { password, email } = req.body;
      // console.log(req.body);

      let adminExist = await adminModel.findOne({email});
      console.log(adminExist, "kikii");
      if (!adminExist) {
        return res.status(400).send({ message: "You are not an admin", success: false });
      } else {
        const isPasswordValid = await bcrypt.compare(password, adminExist.password);
        if (!isPasswordValid) {
          return res.status(400).send({ message: "Incorrect password", success: false });
        } else {
          let token = jwt.sign({ adminId: adminExist._id }, process.env.JwtAdminSecretKey, { expiresIn: '1day' });
          return res.status(200).send({ token: token, adminExist: adminExist, message: "Login successful", success: true });
        }
      }
    } catch (error) {
      // console.log(error);
      return res.json({ error, message: "Internal server error", success: false });
    }
  },
  Club:async(req,res)=>{
    // console.log("lo-ploll");
    let club = await clubModel.find({});
    // console.log(club);
    return res.status(200).send({ club,message: "data get successfull", success: true });


  },
  Block:async(req,res)=>{
    // console.log("kikikk",req.body);
    const {_id} = req.body
    // const id=item._id
    // console.log(_id);
    try {
      let club = await clubModel.findByIdAndUpdate({_id});
  
      if (!club) {
        return res.status(404).send({ message: "Club not found", success: false });
      }
  // console.log(club.block,"klklkl");
      club.block = !club.block;
  
      let updatedClub = await club.save();
      let clubs = await clubModel.find({});
      // console.log(updatedClub,"ggggg");
      // console.log(clubs,"gggffgg");

      return res.status(200).send({ club: clubs, message: "Club updated successfully", success: true });
    } catch (err) {
      // console.error(err);
      return res.status(500).send({ message: "Server error", success: false });
    }

  },

  User:async(req,res)=>{
    // console.log("lo-ploll");
    let user = await userModel.find({});
    // console.log(user,"kmkkm");
    return res.status(200).send({ user,message: "data get successfull", success: true });


  },

  UserBlock:async(req,res)=>{
    // console.log("kikikk",req.body);
    const {_id} = req.body
    // const id=item._id
    // console.log(_id);
    try {
      let user = await userModel.findByIdAndUpdate({_id});
  
      if (!user) {
        return res.status(404).send({ message: "user not found", success: false });
      }
  // console.log(user.block,"klklkl");
      user.block = !user.block;
  
      let updatedUsers = await user.save();
      let users = await userModel.find({});
      // console.log(updatedUsers,"ggggg");
      // console.log(users,"gggffgg");

      return res.status(200).send({ user: users, message: "User updated successfully", success: true });
    } catch (err) {
      // console.error(err);
      return res.status(500).send({ message: "Server error", success: false });
    }

  },

  Tournaments:async(req,res)=>{
    // console.log("lo-ploll");
    let Tournamentsdata = await Tournament.find({}).populate('club')
    // console.log(Tournamentsdata,"kmkkm");
    return res.status(200).send({ Tournamentsdata,message: "data get successfull", success: true });
  },
  BlockTournaments:async(req,res)=>{
    // console.log("kikikk",req.body);
    const {_id} = req.body
    // const id=item._id
    // console.log(_id);
    try {
      let tournament = await Tournament.findByIdAndUpdate({_id});
  
      if (!tournament) {
        return res.status(404).send({ message: "user not found", success: false });
      }
  // console.log(tournament.block,"klklkl");
  tournament.block = !tournament.block;
  
      let updatedTournament = await tournament.save();
      let tournaments = await Tournament.find({}).populate('club')
      // console.log(updatedTournament,"ggggg");
      // console.log(tournaments,"gggffgg");

      return res.status(200).send({ tournaments: tournaments, message: "User updated successfully", success: true });
    } catch (err) {
      // console.error(err);
      return res.status(500).send({ message: "Server error", success: false });
    }

 },

 Matches:async(req,res)=>{
  // console.log("lo-ploll");
    let matchesdata = await Match.find({}).populate('firstteam').populate('secondteam').populate('tournament')
    // console.log(matchesdata,"kmkkm");
    return res.status(200).send({ matchesdata,message: "data get successfull", success: true });
 },

 BlockMatches:async(req,res)=>{
  // console.log("kikikk",req.body);
    const {_id} = req.body
    // const id=item._id
    console.log(_id);
    try {
      let match = await Match.findByIdAndUpdate({_id});
  
      if (!match) {
        return res.status(404).send({ message: "user not found", success: false });
      }
    //  console.log(match.block,"klklkl");
     match.block = !match.block;
  
      let updatedMatches = await match.save();
      let matches = await Match.find({}).populate('firstteam').populate('secondteam').populate('tournament')
      // console.log(updatedMatches,"ggggg");
      // console.log(matches,"gggffgg");
      return res.status(200).send({ matches:matches, message: "User updated successfully", success: true });
    } catch (err) {
      // console.error(err);
      return res.status(500).send({ message: "Server error", success: false });
    }
 },

 UsersCount:async(req,res)=>{
  try {  
  let count = await userModel.find({}).count()
    // console.log(count,"kmkkm");
    return res.status(200).send({ count,message: "data get successfull", success: true });
 }catch (error) {
  // console.error(err);
  return res.status(500).send({ message: "Server error", success: false });
}
  
},

ClubsCount:async(req,res) =>{
  try {
    let count = await clubModel.find({}).count()
    // console.log(count,"kmkkm");
    return res.status(200).send({ count,message: "data get successfull", success: true });
  } catch (error) {
    // console.error(err);
    return res.status(500).send({ message: "Server error", success: false });
  }
},


}
