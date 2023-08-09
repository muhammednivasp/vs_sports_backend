const clubModel = require('../model/club');
const AnnounceModel = require('../model/announceTournament')
const Tournament = require('../model/tournament')
const Teams = require('../model/teams')
const Matches = require('../model/matches')
const Tickets = require('../model/tickets')
const jwt = require("jsonwebtoken")
const Token = require("../model/token")
const sendEmail = require("../utils/sendEmail")
const crypto = require("crypto")
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const bcrypt = require('bcrypt');
const { log } = require('console');
const matchModel = require('../model/matches');
const Image = require('../model/imagefile')
const { MultiUploadCloudinary  } = require('../utils/Cloudinery')

const handleErrors = (err) => {
  let errors = { email: "", name: "", phonenumber: "", password: "" };

  if (err.message.includes("Incorrect email")) {
    errors.email = "That email is not registered";
  }

  if (err.message.includes("Incorrect phonenumber")) {
    errors.phonenumber = "That phone number is not correct";
  }

  if (err.message.includes("Incorrect name")) {
    errors.name = "That name is not correct";
  }

  if (err.message.includes("Incorrect password")) {
    errors.password = "That password is incorrect";
  }

  if (err.code === 11000) {
    errors.email = "Email is already registered";
  }

  if (err.message.includes("User validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      if (properties.path === "email") {
        errors.email = properties.message;
      }
      if (properties.path === "name") {
        errors.name = properties.message;
      }
      if (properties.path === "phonenumber") {
        errors.phonenumber = properties.message;
      }
      if (properties.path === "password") {
        errors.password = properties.message;
      }
    });
  }

  return errors;
};

module.exports = {


  ClubSignup: async (req, res) => {
    try {
      console.log(req.body)
      const { password, clubname, email, registration, location, isUser } = req.body;

      const clubExist = await clubModel.findOne({ email });

      if (clubExist) {
        return res.status(400).send({ message: "Club already exists", success: false });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      // console.log(hashedPassword)
      const newClub = await clubModel.create({ clubname, email, registration, location, password: hashedPassword, isUser });

      //node mailer
      const token = await new Token({
        userId: newClub._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
      console.log(token);
      const url = `${process.env.BASE_URL}club/${newClub._id}/verify/${token.token}`;
      await sendEmail(newClub.email, "verify Email", url);
      return res.status(201).json({
        clubId: newClub._id,
        created: true,
        message: "An email sent to your account, please verify",
      });

      // return res.status(200).send({ message: "Club created successfully", success: true });

    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: errors, success: false });
    }
  },

  VerifyClubMail: async (req, res) => {
    try {
      // console.log("nan ethi sir")
      const club = await clubModel.findOne({ _id: req.params.id })
      if (!club) {
        return res.status(400).send({ message: "Invalid link" })
      }

      const token = await Token.findOne({
        userId: club._id,
        token: req.params.token
      })
      if (!token) return res.status(400).send({ message: "Invalid link" })

      await clubModel.updateOne({ _id: club._id }, { verified: true })
      await token.deleteOne()

      res.status(200).send({ message: "Email Verified Successfully" })

    } catch (error) {
      return res.json({ error, message: "Internal server error", success: false });

    }
  },

  Forgot: async (req, res) => {
    try {
      // console.log("ethiee")
      const { email, isUser } = req.body;
      // console.log(req.body)

      const clubExist = await clubModel.findOne({ email });
      // console.log(clubExist, "loploplp")

      if (!clubExist) {
        return res.status(400).send({ message: "user does'nt exists", success: false });

      }
      
      const token = await new Token({
        userId: clubExist._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
      const url = `${process.env.BASE_URL}club/${clubExist._id}/forgotverify/${token.token}`;
      await sendEmail(clubExist.email, "verify Email", url);
      res.status(201).json({
        userId: clubExist._id,
        created: true,
        message: "An email sent to your account, please verify",
        success: true
      });

    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "error", success: false });
    }
  },

  VerifyForgotMail: async (req, res) => {
    try {
      // console.log("ividend ")
      const { newpassword, token, clubId } = req.body;
      // console.log(req.body, "bodyiiiii");
      const club = await clubModel.findOne({ _id: clubId });

      if (!club) {
        return res.status(400).send({ message: "Invalid link" });
      }

      const verifyToken = await Token.findOne({
        userId: club._id,
        token: token,
      });

      if (!verifyToken) {
        return res.status(400).send({ message: "Invalid link" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newpassword, salt);
      const updated = await clubModel.updateOne(
        { _id: club._id },
        { $set: { password: hashedPassword } }
      );

      await verifyToken.deleteOne();

      if (updated) {
        return res
          .status(200)
          .send({ message: "Password changed successfully", success: true });
      }

      return res
        .status(400)
        .send({ message: "Password change failed", success: false });
    } catch (error) {
      return res
        .status(500)
        .json({ error, message: "Internal server error", success: false });
    }
  },

  EditClub: async (req, res) => {
    try {
      // console.log("edit club profile"),
        // console.log(req.body, "body")
      const { email, clubRegisterNo, isUser, location, EmailId, name } = req.body;
      // console.log(req.body)
      const oldclub = await clubModel.findOne({ email: EmailId });

      if (email !== EmailId) {
        // console.log("nan ethi")
        const club = await clubModel.findOne({ email });
        if (club) {
          return res.status(400).send({ message: "Email already exists", success: false });
        }
      }

      const token = await new Token({
        userId: oldclub._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
      // console.log("nan ethi")
      const url = `${process.env.BASE_URL}club/${oldclub._id}/verifyclubtoedit/${token.token}`;
      await sendEmail(email, "verify Email", url);
      res.status(201).send({
        message: "An email sent to your account, please verify",
        success: false
      });


    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  VerifyEditProfile: async (req, res) => {
    try {
      const { data, token, clubid } = req.body
      // console.log("koikoikoi")
      const club = await clubModel.findOne({ _id: clubid })
      // console.log(club)

      if (!club) {
        return res.status(400).send({ message: "Invalid link" })
      }

      const verifytoken = await Token.findOne({
        userId: club._id,
        token: token
      })
      if (!verifytoken) return res.status(400).send({ message: "Invalid link" })

      await clubModel.updateOne({ _id: club._id }, { isUser: data.isUser, email: data.email, clubname: data.name, location: data.location, registration: data.clubRegisterNo })
      const clubExist = await clubModel.findOne({ _id: club._id })
      // console.log(clubExist, "exist")
      await verifytoken.deleteOne()

      res.status(200).send({ clubExist, message: "Email Verified Successfully", success: true })

    } catch (error) {
      return res.json({ error, message: "Internal server error", success: false });

    }
  },

  ChangePassword: async (req, res) => {
    try {
      // console.log("ioiooioi")
      const { Password, NewPassword, PasswordConform, isUser, EmailId } = req.body;
      // console.log(req.body)
      let clubExist = await clubModel.findOne({ email: EmailId, isUser });
      if (clubExist) {
        const isPasswordValid = await bcrypt.compare(Password, clubExist.password);
        if (!isPasswordValid) {
          return res.status(400).send({ message: "Incorrect password", success: false });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(NewPassword, salt);
        const club = await clubModel.updateOne({ email: EmailId }, { $set: { password: hashedPassword } })

        // console.log(club, "kjjjjjjjjjikii")
        if (club) {
          return res.status(200).send({ message: "Updated successfully", success: true });
        }
      }
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  AnnounceTournament: async (req, res) => {
    try {
      req.body.tournamentname = req.body.tournamentname.toUpperCase()
      const { tournamentname, location, teamsrequired, lastdate, category, fee, EmailId } = req.body
      // console.log(req.body, "announce")

      const club = await clubModel.findOne({ email: EmailId })
      // console.log(club)

      if (club) {
        // console.log(club, "popopo")
        const created = await AnnounceModel.create({ tournamentname, location, teamsrequired, lastdate, category, fee, club: club._id })
        // console.log(created, "lopiuyt")
        if (created) {
          res.status(200).json({ message: "Tournament announced successfully" });
        } else {
          res.status(400).json({ message: "Tournament announce is error" });
        }
      } else {
        res.status(400).json({ message: "Tournament announce is error" });
      }
      // console.log(req.body, "announce")

    } catch (error) {
      const errors = handleErrors(error);
      // console.log(error)
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  Announced: async (req, res) => {
    try {
      // console.log(req.body,"glgllglg");
      const { clubId } = req.body
      // console.log(req.body);
      // console.log(clubId);
      const details = await AnnounceModel.find({ club: clubId }).sort({ lastdate: -1 })
      // console.log(details)
      if (details) {
        res.status(200).json({ details, message: "Tournament announced successfully" });
      } else {
        res.status(400).json({ message: "Tournament announce is error" });
      }
    } catch (error) {
      const errors = handleErrors(error);
      // console.log(error)
      return res.json({ errors, message: "Internal server error", success: false });
    }

  },

  EditAnnounceTournament: async (req, res) => {
    try {
      const { tournamentname, location, teamsrequired, lastdate, category, fee, EmailId, id } = req.body
      // console.log(req.body, "announce")
      const club = await clubModel.findOne({ email: EmailId })
      // console.log(club, "club ug")
      if (club) {
        // console.log("llllllppppp")
        const announce = await AnnounceModel.findOne({ _id: id })
        // console.log(announce,"liu");
        if(announce.added===true){
          const announceId = announce._id
          const tournament = await Tournament.updateOne(
            { announcedid: announceId },
            {
              tournamentname,
              location,
              tournamenttype:category,
            }
          );
        }
        // console.log(club, "popopo")
        const updated = await AnnounceModel.findByIdAndUpdate(
          { _id: id },
          {
            tournamentname,
            location,
            teamsrequired,
            lastdate,
            category,
            fee
          }
        );
        const value = await AnnounceModel.findOne({ id })

        // console.log(updated, "lopiuyt")
        if (updated) {
          res.status(200).json({ value, message: "Tournament announced successfully" });
        } else {
          res.status(400).json({ message: "Tournament announce is error" });
        }
      } else {
        res.status(400).json({ message: "Tournament announce is error" });
      }
      // console.log(req.body, "announce")

    } catch (error) {
      const errors = handleErrors(error);
      // console.log(error)
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  AddNewTournament: async (req, res) => {
    try {
      req.body.tournamentname = req.body.tournamentname.toUpperCase()
      const { tournamentname, location, club, tournamenttype } = req.body
      // console.log(req.body, "announce")
      try {
        const created = await Tournament.create({ tournamentname, location, club, tournamenttype })
        // console.log(created, "lopiuyt")
        res.status(200).json({ message: "Tournament added successfully", success: true });

      } catch (error) {
        res.status(400).json({ message: "Tournament add is error", success: false });

      }
    } catch (error) {
      const errors = handleErrors(error);
      // console.log(error)
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  Tournament: async (req, res) => {
    try {
      const { clubId } = req.body
      // console.log(req.body);
      // console.log(clubId);
      const details = await Tournament.find({ club: clubId })
      // console.log(details)
      if (details) {
        res.status(200).json({ details, message: "Tournament show successfully" });
      } else {
        res.status(400).json({ message: "Tournament show error" });
      }
    } catch (error) {
      const errors = handleErrors(error);
      // console.log(error)
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  EditTournament: async (req, res) => {
    try {
      const { tournamentname, location, tournamenttype, status, EmailId, id } = req.body
      // console.log(req.body, "tournament")
      const club = await clubModel.findOne({ email: EmailId })
      // console.log(club, "club ug")
      if (club) {
        // console.log(club, "popopo")
        const tournament = await Tournament.findOne({ _id: id })
          if(tournament.announced===true){
            const announceId = tournament.announcedid
            const updateannounce = await AnnounceModel.findByIdAndUpdate(
              { _id: announceId },
              {
                tournamentname,
                location,
                category:tournamenttype,
              },{new:true}
            );
          }
        const updated = await Tournament.findByIdAndUpdate(
          { _id: id },
          {
            tournamentname,
            location,
            tournamenttype,
            status,
          },{new:true}
        );
        const value = await Tournament.findOne({ id })
        // console.log(updated, "lopiuyt")
        if (updated) {
          res.status(200).json({ value, message: "Tournament updated successfully" });
        } else {
          res.status(400).json({ message: "Tournament update is error" });
        }
      } else {
        res.status(400).json({ message: "Tournament update is error" });
      }
      // console.log(req.body, "tournament")

    } catch (error) {
      const errors = handleErrors(error);
      // console.log(error)
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  TournamentShow: async (req, res) => {
    try {
      // const { clubId } = req.body
      // console.log(req.body);
      // console.log("ethiyooooopopopoo");
      const details = await Tournament.find({})
      // console.log(details, "ffggfgfgfg")
      if (details) {
        res.status(200).json({ details, message: "Tournament show successfully" });
      } else {
        res.status(400).json({ message: "Tournament show error" });
      }
    } catch (error) {
      const errors = handleErrors(error);
      // console.log(error)
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  Limit: async (req, res) => {
    try {
      const { id } = req.body
      // console.log('llllkkkkkkl');
      const details = await AnnounceModel.findOne({ _id: id }, { teamsrequired: 1, _id: 0 })
      // console.log(details, 'lllll');
      res.status(200).json({ details, message: "limit get successfully" });
    } catch (error) {
      res.status(400).json({ message: "Limit show error" });
    }
  },

  Details: async (req, res) => {
    try {
      const { id } = req.body
      const details = await Teams.find({ announcementid: id })
      // console.log(details, 'lllll');
      res.status(200).json({ details, message: "details get successfully" });
    } catch (error) {
      res.status(400).json({ message: "details show error" });

    }
  },

  TeamManual: async (req, res) => {
    // console.log('llldfdsffewfefewfwewer12344');
    try {
      const {
        clubname,
        location,
        phonenumber,
        registration,
        tournament,
        isUser,
        userId,
        manualAdd,
        amount,
      } = req.body

      // console.log(req.body, "klklk;kl");
      let value = req.body
      // const {orderId} = req.params;
      // console.log('ethiy0')
      const order = await Tournament.findById(tournament).populate('club');
      // console.log(order, "orderlller")
      let amount1 = order.fee
      const datas = { ...order, isUser: isUser }

      // if (amount <= 0) {
      // console.log(value, "loploplopl");

      // console.log(location, clubname, "hoihoi");
      try {
        const newTeam = await Teams.create({ teamname: clubname, location, phonenumber, registration, tournament, userId, isUser, amount, manualAdd });
        // console.log(newTeam, "frffrf");
        return res.status(200).json({ newTeam });

      } catch (error) {
        // console.error(error);
        res.status(500).send("Error occurred");
      }

    } catch (error) {
      console.log(error);
    }
  },

  AnnounceToTournament: async (req, res) => {
    try {
      const { datasOf } = req.body
      const { tournamentname, location, _id, category, club, added } = datasOf
      // console.log(tournamentname);
      // console.log(req.body, "ssssdd");
      try {
        const add = await Tournament.create({ announcedid: _id, tournamentname, location, tournamenttype: category, club, announced: true })
        // console.log(add, "add")
        // console.log(_id, "add")
        const announce = await AnnounceModel.findByIdAndUpdate({ _id: _id }, { added: true },{new:true})
        // console.log(announce,"announce");
        return res.status(200).json({announce, message: "Team added successfully" });
      } catch (error) {
        res.status(500).send("Error occurred");
      }

    } catch (error) {
      res.status(500).send("Error occurred");

    }
  },

  TeamGet:async(req,res)=>{
    try {
    const {_id,tournamentname,location,club,tournamenttype,status,announced,announcedid} = req.body
    // console.log(announced,"dataofthe",announcedid);
    let teams =  (announced===true?
    await Teams.find({ announcementid:announcedid })
    : 
    await Teams.find({ tournament:_id })
    )
    // console.log(teams,"teamsssk");
   res.status(200).json({teams})
      
    } catch (error) {
      // console.log(error);
      res.status(500).send("Error occurred");

    }
  },

  MatchPost:async(req,res)=>{
    try {
      const matchdata = req.body
      // console.log(matchdata,"match");
      const {matchnumber,date,time,firstteamid,secondteamid,matchstatus,tickets,ticketsfee,tournament,results}  = req.body
      const finding = await Matches.findOne({matchnumber,tournament})
      // console.log(finding,"jkjk");
      if(finding){
        res.status(500).send({message:"Match Number Alreday Exists"})
      }else{
      const matchadd = await Matches.create({matchnumber,date,time,firstteam:firstteamid,secondteam:secondteamid,matchstatus,tickets,tournament,results,ticketsfee})
      const details = await Matches.find({tournament}).populate('firstteam').populate('secondteam').populate('tournament')
      // console.log(details,"lopllop")
      // console.log(matchadd,"lopllop")
      res.status(200).json({details,message:"Match Edit successfully"})
      }
    } catch (error) {
      // console.log(error);
      res.status(500).send("Error occurred");
    }
  },

  Matches:async(req,res)=>{
    try {
    const {_id} = req.body
    // console.log(_id,"ido");
    const finding = await Matches.find({tournament:_id}).populate('firstteam').populate('secondteam').populate('tournament')
    // console.log(finding,"matches")
    res.status(200).json({finding,message:"Matches get successfully"})

  } catch (error) {
    // console.log(error);
    res.status(500).send("Error occurred");
  }
  },

  EditMatchPost:async(req,res)=>{
      try {
      const matchdata = req.body
      // console.log(matchdata,"match");
      const {matchnumber,date,time,firstteamid,secondteamid,matchstatus,tickets,ticketsfee,tournament,results,id}  = req.body
      // console.log(id,"idddddd")
      const finding = await Matches.findOne({_id:id})
      // console.log(finding,"jkjk");
      if(finding){
      const matchadd = await Matches.updateOne({_id:id},{matchnumber,date,time,firstteam:firstteamid,secondteam:secondteamid,matchstatus,tickets,tournament,results,ticketsfee})
      const details = await Matches.find({tournament}).populate('firstteam').populate('secondteam').populate('tournament')
      // console.log(details,"lopllop")
      // console.log(matchadd,"lopllop")
      res.status(200).json({details,message:"Match Edit successfully"})
      }
    } catch (error) {
      // console.log(error);
      res.status(500).send("Error occurred");
    }
  },

  ClubMatches: async (req, res) => {
    try {
      const { clubId } = req.body;
      // console.log(clubId, "clubId");
      const clubObjectId = new ObjectId(clubId);
      const matches = await Matches.aggregate([
        {
          $lookup: {
            from: "tournaments",
            localField: "tournament",
            foreignField: "_id",
            as: "tournamentData",
          },
        },
        {
          $unwind: "$tournamentData",
        },
        {
          $match: {
            "tournamentData.club": clubObjectId,
          },
        },
        {
          $lookup: {
            from: "teams",
            localField: "firstteam",
            foreignField: "_id",
            as: "firstteamData",
          },
        },
        {
          $unwind: "$firstteamData",
        },
        {
          $lookup: {
            from: "teams",
            localField: "secondteam",
            foreignField: "_id",
            as: "secondteamData",
          },
        },
        {
          $unwind: "$secondteamData",
        },
        {
          $project: {
            _id: 1,
            matchnumber: 1,
            date: 1,
            time: 1,
            matchstatus: 1,
            ticketstatus: 1,
            results: 1,
            "tournamentData.tournamentname": 1,
            "firstteamData.teamname": 1,
            "secondteamData.teamname": 1,
          },
        },
      ]);
  
      // console.log(matches, "Matches");
      res.status(200).json({ matches });
    } catch (error) {
      // console.log(error);
      res.status(500).json({ error: "Error occurred" });
    }
  },

  ScoreChange:async(req,res)=>{
    try {
    // console.log("hhhh",req.body,"bodiesss");
    const {id,score,scorers,team} = req.body
    const updateObject = team === 'first'
      ? { 'results.firstteamscore': score, 'results.firstteamscorers': scorers }
      : { 'results.secondteamscore': score, 'results.secondteamscorers': scorers };
    const matchResults = await Matches.findByIdAndUpdate({_id:id},updateObject,{new:true}).populate('firstteam').populate('secondteam').populate('tournament')
    // console.log(matchResults,'mnn')
    res.status(200).json({matchResults,message:"Score added successfully"})

  } catch (error) {
    // console.log(error);
    res.status(500).send("Error occurred");
  }
  },

  ClubCount:async(req,res)=>{
    try {
      const {id,announce} = req.body;
      const Id = new ObjectId(id);
      // console.log(id,"jhjhjjhjdsdss");
      // console.log(Id,"qqqqdsdss");
      let teams
      // const announce = tournament.announced
      // console.log(announce,"fdfdfdasa");
       if(announce===false){
       teams = await Teams.find({tournament:Id }).count()
       }else{
       teams = await Teams.find({announcementid:Id }).count()
       }
      //  console.log(teams,"jhdf");
      res.json({teams,message:"success"});
    } catch (error) {
      // console.log(error);
      res.status(500).json({ error: 'An error occurred' });
    }
  },

  createCommunity :async (req, res) => {
  try {
    const url = req.file.path;
    const { title, description, type, createdAt, status } = req.body;
    const data = await uploadToCloudinary(url, "clubDatas");
    const image = data.url;
    const userId = req.userId;
    const newCommunity = new communityModel({
      title,
      image,
      description,
      type,
      createdAt,
      members: [
        {
          member: userId,
          role: "Admin",
        },
      ],
      status,
    });
    const community = await newCommunity.save();
    if (community) {
      res
        .status(200)
        .json({ success: true, message: "Community Created Successfully" });
    }
  } catch (error) {
    // console.log(error);
    return res.status(500).json({ error: true, message: error.message});
  }
  },

  UploadImage: async (req, res) => {
    try {
      // console.log(req.files, "jgf");
      // console.log(req.body, "klklk");
      const { id } = req.body;
      // console.log(id, "klkl");
  
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid club id." });
      }
  
      const images = await MultiUploadCloudinary(req.files, "club");
      // console.log(images);
      for (const item of images) {
        // console.log(item, "kjh");
        try {
          const updatedClub = await clubModel.findByIdAndUpdate(
            id,
            { $push: { images: item } },
            { new: true }
          );
          // console.log(updatedClub, "gfgfgdd");
        } catch (error) {
          // console.error("Error updating club:", error);
          return res.status(500).json({ error: "Error updating club." });
        }
      }
  
      res.status(200).json({ message: "Images uploaded successfully." });
    } catch (error) {
      // console.error("Error uploading images:", error);
      res.status(500).json({ error: "An error occurred while uploading images." });
    }
  },

  GetImages:async(req,res) => {
    try {
    const {id} = req.body
    // console.log(id,"kllsaas");
    const clubimages = await clubModel.findOne({_id:id},{images:1,_id:0});
    // console.log(clubimages.images,"fgfg");
    const images = clubimages.images
    res.status(200).json({images,message: "Images get successfully." });
  } catch (error) {
    // console.error("Error get images:", error);
    res.status(500).json({ error: "An error occurred while get images." });
  }
  },

  ClubTicketGet:async(req,res)=>{
    try {
    const {item,clubdatas} = req.body
    // console.log("ffff",item,"frfrfrfrf",clubdatas);
      const id=new ObjectId(item._id)
      // const userid=new ObjectId(clubdatas.id)

    const ticketsdata = await Tickets.find({ match:id})
    .populate('userId')
    .populate({
      path: 'match',
      model: 'matches',
      populate: [
        {
          path: 'firstteam',
          model: 'teams' 
        },
        {
          path: 'secondteam',
          model: 'teams'
        },
        {
          path: 'tournament',
          model: 'tournament',
          populate: [
            {
              path:'club',
              model: 'clubs',
            }
          ]
        }
      ]
    });
      // console.log(ticketsdata,"jijijid")
      // console.log("Populated tickets:", JSON.stringify(ticketsdata, null, 2)); 
     res.status(200).json({ticketsdata, message: "tickets get successfully" });
  
    } catch (error) {
      // console.log(error);
      res.status(500).send("Error occurred");
    }
  },

  TicketStatus: async (req, res) => {
    try {
    const {id} = req.body;
    // console.log(req.body, "jhsdwe");
      const ticket = await Tickets.findOne({'tickets._id':id});
      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }
  
      const newStatus = !ticket.tickets.find(t => t._id.toString() === id).status;
  
      const updatedTicket = await Tickets.findOneAndUpdate(
        { 'tickets._id': id },
        { $set: { 'tickets.$.status': newStatus } },
        { new: true }
      );
  
      // console.log(updatedTicket, "Updated ticket");
      res.status(200).json({ success: true, ticket: updatedTicket,message: "changed ticket status successfully"});
    } catch (error) {
      // console.error(error);
      res.status(500).json({ success: false, message: "Error updating ticket status" });
    }
  },

  Auth:async(req,res)=>{
    try {
      // console.log('inside auth function');
      const token = req.headers["authorization"]?.split(" ")[1];
      if (!token) {
        // console.log('no token');
        return res.status(401).json({
          message: "Club Authentication failed: Token not found",
          success: false,
        });
      }
  
      const secretKey = process.env.JwtClubSecretKey;
     //  console.log("Secret Key:", secretKey);
  
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
        // console.log('there is err');

        //   console.log("Error while verifying token:", err);
          return res.status(401).json({
            message: "Club Authentication failed: Invalid token",
            success: false,
          });
        } else {
          // req.userId = decoded.userId;
          console.log('hai');
          clubModel.findById({_id:decoded.userId}).then((response)=>{
            // console.log('hello');
            // console.log(response,998);
            if(response.block){
              // console.log('club is blocked');
              return res.status(401).json({
                message: " Blocked",
                success: false,
              });
            }else{
              // console.log(req.userId, "12iuysdhfd", decoded);
              return res.status(200).json({
                message: "Club Authentication success",
                success: true,
              });
            }
          })
        
        }
      });
    } catch (error) {
      console.log(error);
      return res.status(401).json({
        message: "Club Authentication failed",
        success: false,
      });
    }
  }
  
  
  
  
      
}
