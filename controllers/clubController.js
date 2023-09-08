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
const { MultiUploadCloudinary } = require('../utils/Cloudinery')

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
      const { password, clubname, email, registration, location, isUser } = req.body;
      const clubExist = await clubModel.findOne({ email });
      if (clubExist) {
        return res.status(400).send({ message: "Club already exists", success: false });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newClub = await clubModel.create({ clubname, email, registration, location, password: hashedPassword, isUser });

      //node mailer
      const token = await new Token({
        userId: newClub._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
      const url = `${process.env.BASE_URL}/club/${newClub._id}/verify/${token.token}`;
      await sendEmail(newClub.email, "verify Email", url);
      return res.status(201).json({
        clubId: newClub._id,
        created: true,
        message: "An email sent to your account, please verify",
      });

    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: errors, success: false });
    }
  },

  VerifyClubMail: async (req, res) => {
    try {
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
      const { email, isUser } = req.body;

      const clubExist = await clubModel.findOne({ email });

      if (!clubExist) {
        return res.status(400).send({ message: "user does'nt exists", success: false });

      }

      const token = await new Token({
        userId: clubExist._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
      const url = `${process.env.BASE_URL}/club/${clubExist._id}/forgotverify/${token.token}`;
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
      const { newpassword, token, clubId } = req.body;
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

      const { email, clubRegisterNo, isUser, location, EmailId, name } = req.body;
      const oldclub = await clubModel.findOne({ email: EmailId });

      if (email !== EmailId) {
        const club = await clubModel.findOne({ email });
        if (club) {
          return res.status(400).send({ message: "Email already exists", success: false });
        }
      }
      const token = await new Token({
        userId: oldclub._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
      const url = `${process.env.BASE_URL}/club/${oldclub._id}/verifyclubtoedit/${token.token}`;
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
      const club = await clubModel.findOne({ _id: clubid })

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
      await verifytoken.deleteOne()

      res.status(200).send({ clubExist, message: "Email Verified Successfully", success: true })

    } catch (error) {
      return res.json({ error, message: "Internal server error", success: false });

    }
  },

  ChangePassword: async (req, res) => {
    try {
      const { Password, NewPassword, PasswordConform, isUser, EmailId } = req.body;
      let clubExist = await clubModel.findOne({ email: EmailId, isUser });
      if (clubExist) {
        const isPasswordValid = await bcrypt.compare(Password, clubExist.password);
        if (!isPasswordValid) {
          return res.status(400).send({ message: "Incorrect password", success: false });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(NewPassword, salt);
        const club = await clubModel.updateOne({ email: EmailId }, { $set: { password: hashedPassword } })

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
      const club = await clubModel.findOne({ email: EmailId })

      if (club) {
        const created = await AnnounceModel.create({ tournamentname, location, teamsrequired, lastdate, category, fee, club: club._id })
        if (created) {
          res.status(200).json({ message: "Tournament announced successfully" });
        } else {
          res.status(400).json({ message: "Tournament announce is error" });
        }
      } else {
        res.status(400).json({ message: "Tournament announce is error" });
      }

    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  Announced: async (req, res) => {
    try {
      const { clubId } = req.body
      const details = await AnnounceModel.find({ club: clubId }).sort({ lastdate: -1 })
      if (details) {
        res.status(200).json({ details, message: "Tournament announced successfully" });
      } else {
        res.status(400).json({ message: "Tournament announce is error" });
      }
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }

  },

  EditAnnounceTournament: async (req, res) => {
    try {
      const { tournamentname, location, teamsrequired, lastdate, category, fee, EmailId, id } = req.body
      const club = await clubModel.findOne({ email: EmailId })
      if (club) {
        const announce = await AnnounceModel.findOne({ _id: id })
        if (announce.added === true) {
          const announceId = announce._id
          const tournament = await Tournament.updateOne(
            { announcedid: announceId },
            {
              tournamentname,
              location,
              tournamenttype: category,
            }
          );
        }
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

        if (updated) {
          res.status(200).json({ value, message: "Tournament announced successfully" });
        } else {
          res.status(400).json({ message: "Tournament announce is error" });
        }
      } else {
        res.status(400).json({ message: "Tournament announce is error" });
      }

    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  AddNewTournament: async (req, res) => {
    try {
      req.body.tournamentname = req.body.tournamentname.toUpperCase()
      const { tournamentname, location, club, tournamenttype } = req.body
      try {
        const created = await Tournament.create({ tournamentname, location, club, tournamenttype })
        res.status(200).json({ message: "Tournament added successfully", success: true });

      } catch (error) {
        res.status(400).json({ message: "Tournament add is error", success: false });
      }
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  Tournament: async (req, res) => {
    try {
      const { clubId } = req.body
      const details = await Tournament.find({ club: clubId, block: { $ne: true } })
      if (details) {
        res.status(200).json({ details, message: "Tournament show successfully" });
      } else {
        res.status(400).json({ message: "Tournament show error" });
      }
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  EditTournament: async (req, res) => {
    try {
      const { tournamentname, location, tournamenttype, status, EmailId, id, announced } = req.body
      const club = await clubModel.findOne({ email: EmailId })
      if (club) {
        let tournament
        if (announced === true) {
          tournament = await Tournament.findOne({ announcedid: id })
        } else {
          tournament = await Tournament.findOne({ _id: id })
        }
        if (tournament?.announced === true) {
          const announceId = tournament.announcedid
          const updateannounce = await AnnounceModel.findByIdAndUpdate(
            { _id: announceId },
            {
              tournamentname,
              location,
              category: tournamenttype,
            }, { new: true }
          );
        }
        const updated = await Tournament.findByIdAndUpdate(
          { _id: tournament.id },
          {
            tournamentname,
            location,
            tournamenttype,
            status,
          }, { new: true }
        );
        let value
        if (announced === true) {
          value = await Tournament.findOne({ announcedid: id })
        } else {
          value = await Tournament.findOne({ _id: id })
        }
        if (updated) {
          res.status(200).json({ value, message: "Tournament updated successfully" });
        } else {
          res.status(400).json({ message: "Tournament update is error" });
        }
      } else {
        res.status(400).json({ message: "Tournament update is error" });
      }
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  Limit: async (req, res) => {
    try {
      const { id } = req.body
      const details = await AnnounceModel.findOne({ _id: id }, { teamsrequired: 1, _id: 0 })
      res.status(200).json({ details, message: "limit get successfully" });
    } catch (error) {
      res.status(400).json({ message: "Limit show error" });
    }
  },

  Details: async (req, res) => {
    try {
      const { id } = req.body
      const details = await Teams.find({ announcementid: id })
      res.status(200).json({ details, message: "details get successfully" });
    } catch (error) {
      res.status(400).json({ message: "details show error" });
    }
  },

  TeamManual: async (req, res) => {
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

      let value = req.body
      const order = await Tournament.findById(tournament).populate('club');
      let amount1 = order.fee
      const datas = { ...order, isUser: isUser }

      try {
        const newTeam = await Teams.create({ teamname: clubname, location, phonenumber, registration, tournament, userId, isUser, amount, manualAdd });
        return res.status(200).json({ newTeam });

      } catch (error) {
        res.status(500).send("Error occurred");
      }

    } catch (error) {
      res.status(500).send("Error occurred");
    }
  },

  AnnounceToTournament: async (req, res) => {
    try {
      const { datasOf } = req.body
      const { tournamentname, location, _id, category, club, added } = datasOf
      try {
        const add = await Tournament.create({ announcedid: _id, tournamentname, location, tournamenttype: category, club, announced: true })
        const announce = await AnnounceModel.findByIdAndUpdate({ _id: _id }, { added: true }, { new: true })
        return res.status(200).json({ announce, message: "Team added successfully" });
      } catch (error) {
        res.status(500).send("Error occurred");
      }

    } catch (error) {
      res.status(500).send("Error occurred");

    }
  },

  TeamGet: async (req, res) => {
    try {
      const { _id, tournamentname, location, club, tournamenttype, status, announced, announcedid } = req.body
      let teams = (announced === true ?
        await Teams.find({ announcementid: announcedid })
        :
        await Teams.find({ tournament: _id })
      )
      res.status(200).json({ teams })

    } catch (error) {
      res.status(500).send("Error occurred");

    }
  },

  MatchPost: async (req, res) => {
    try {
      const matchdata = req.body
      const { matchnumber, date, time, firstteamid, secondteamid, matchstatus, tickets, ticketsfee, tournament, results } = req.body
      const finding = await Matches.findOne({ matchnumber, tournament })
      if (finding) {
        res.status(500).send({ message: "Match Number Alreday Exists" })
      } else {
        const matchadd = await Matches.create({ matchnumber, date, time, firstteam: firstteamid, secondteam: secondteamid, matchstatus, tickets, tournament, results, ticketsfee })
        const details = await Matches.find({ tournament }).populate('firstteam').populate('secondteam').populate('tournament')
        res.status(200).json({ details, message: "Match Edit successfully" })
      }
    } catch (error) {
      res.status(500).send("Error occurred");
    }
  },

  Matches: async (req, res) => {
    try {
      const { _id } = req.body
      const finding = await Matches.find({ tournament: _id, block: { $ne: true } }).populate('firstteam').populate('secondteam').populate('tournament')
      res.status(200).json({ finding, message: "Matches get successfully" })

    } catch (error) {
      res.status(500).send("Error occurred");
    }
  },

  EditMatchPost: async (req, res) => {
    try {
      const matchdata = req.body
      const { matchnumber, date, time, firstteamid, secondteamid, matchstatus, tickets, ticketsfee, tournament, results, id } = req.body
      const finding = await Matches.findOne({ _id: id })
      if (finding) {
        const matchadd = await Matches.updateOne({ _id: id }, { matchnumber, date, time, firstteam: firstteamid, secondteam: secondteamid, matchstatus, tickets, tournament, results, ticketsfee })
        const details = await Matches.find({ tournament }).populate('firstteam').populate('secondteam').populate('tournament')
        res.status(200).json({ details, message: "Match Edit successfully" })
      }
    } catch (error) {
      res.status(500).send("Error occurred");
    }
  },

  ClubMatches: async (req, res) => {
    try {
      const { clubId } = req.body;
      const clubObjectId = new ObjectId(clubId);
      const matches = await Matches.aggregate([
        {
          $match: {
            'block': { $ne: true }
          },
        },
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
            'tournamentData.block': { $ne: true }

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

      res.status(200).json({ matches });
    } catch (error) {
      res.status(500).json({ error: "Error occurred" });
    }
  },

  ScoreChange: async (req, res) => {
    try {
      const { id, score, scorers, team } = req.body
      const updateObject = team === 'first'
        ? { 'results.firstteamscore': score, 'results.firstteamscorers': scorers }
        : { 'results.secondteamscore': score, 'results.secondteamscorers': scorers };
      const matchResults = await Matches.findByIdAndUpdate({ _id: id }, updateObject, { new: true }).populate('firstteam').populate('secondteam').populate('tournament')
      res.status(200).json({ matchResults, message: "Score added successfully" })

    } catch (error) {
      res.status(500).send("Error occurred");
    }
  },

  ClubCount: async (req, res) => {
    try {
      const { id, announce } = req.body;
      const Id = new ObjectId(id);

      let teams
      if (announce === false) {
        teams = await Teams.find({ tournament: Id, block: { $ne: true } })
      } else {
        teams = await Teams.find({ announcementid: Id, block: { $ne: true } })
      }
      res.json({ teams, message: "success" });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  },

  UploadImage: async (req, res) => {
    try {
      const { id } = req.body;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid club id." });
      }

      const images = await MultiUploadCloudinary(req.files, "club");
      for (const item of images) {
        try {
          const updatedClub = await clubModel.findByIdAndUpdate(
            id,
            { $push: { images: item } },
            { new: true }
          );
        } catch (error) {
          return res.status(500).json({ error: "Error updating club." });
        }
      }

      res.status(200).json({ message: "Images uploaded successfully." });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while uploading images." });
    }
  },

  GetImages: async (req, res) => {
    try {
      const { id } = req.body
      const clubimages = await clubModel.findOne({ _id: id }, { images: 1, _id: 0 });
      const images = clubimages.images
      res.status(200).json({ images, message: "Images get successfully." });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while get images." });
    }
  },

  ClubTicketGet: async (req, res) => {
    try {
      const { item, clubdatas } = req.body
      const id = new ObjectId(item._id)

      const ticketsdata = await Tickets.find({ match: id })
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
                  path: 'club',
                  model: 'clubs',
                }
              ]
            }
          ]
        });

      res.status(200).json({ ticketsdata, message: "tickets get successfully" });

    } catch (error) {
      res.status(500).send("Error occurred");
    }
  },

  TicketStatus: async (req, res) => {
    try {
      const { id } = req.body;
      const ticket = await Tickets.findOne({ 'tickets._id': id });
      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

      const newStatus = !ticket.tickets.find(t => t._id.toString() === id).status;
      const updatedTicket = await Tickets.findOneAndUpdate(
        { 'tickets._id': id },
        { $set: { 'tickets.$.status': newStatus } },
        { new: true }
      );

      res.status(200).json({ success: true, ticket: updatedTicket, message: "changed ticket status successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error updating ticket status" });
    }
  },

  Auth: async (req, res) => {
    try {
      const token = req.headers["authorization"]?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          message: "Club Authentication failed: Token not found",
          success: false,
        });
      }
      const secretKey = process.env.JwtClubSecretKey;
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {

          return res.status(401).json({
            message: "Club Authentication failed: Invalid token",
            success: false,
          });
        } else {
          clubModel.findById({ _id: decoded.userId }).then((response) => {
            if (response.block) {
              return res.status(401).json({
                message: " Blocked",
                success: false,
              });
            } else {
              return res.status(200).json({
                message: "Club Authentication success",
                success: true,
              });
            }
          })

        }
      });
    } catch (error) {
      return res.status(401).json({
        message: "Club Authentication failed",
        success: false,
      });
    }
  },

  AddResults: async (req, res) => {
    try {
      const { winners, runners, tournamentId, announced, emailId } = req.body
      const club = await clubModel.findOne({ email: emailId })
      if (club) {
        let tournament
        if (announced === true) {
          tournament = await Tournament.findOne({ announcedid: tournamentId })
        } else {
          tournament = await Tournament.findOne({ _id: tournamentId })
        }
        if (tournament) {

          const value = await Tournament.findByIdAndUpdate(
            { _id: tournament._id },
            {
              winners: winners,
              runners: runners,
            }, { new: true }
          );
          if (value) {
            res.status(200).json({ value, message: "Results updated successfully" });
          } else {
            res.status(400).json({ message: "Results update is error" });
          }
        } else {
          res.status(400).json({ message: "Results update is error" });
        }
      }
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  }

}
