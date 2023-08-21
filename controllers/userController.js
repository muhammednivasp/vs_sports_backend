
const userModel = require('../model/user');
const clubModel = require('../model/club');
const AnnounceModel = require('../model/announceTournament')
const Tournament = require('../model/tournament')
const Teams = require('../model/teams')
const MatchesModal = require('../model/matches')
const Tickets = require('../model/tickets')
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;


const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt');
const Token = require("../model/token")
const sendEmail = require("../utils/sendEmail")
const crypto = require("crypto")
const Stripe = require('stripe');
const { log } = require('console');
const { Matches } = require('./clubController');
const stripe = Stripe(process.env.STRIPE_KEY)
require('dotenv').config();
const { v4: uuidv4 } = require("uuid")


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
  Signup: async (req, res) => {
    try {
      const { password, name, email, phonenumber, isUser } = req.body;
      const userExist = await userModel.findOne({ email });
      if (userExist) {
        if (userExist.isGoogle === false && userExist.verified === false) {
          return res.status(400).send({ message: "Please verify your account", success: false });

        } else {
          return res.status(400).send({ message: "User already exists", success: false });
        }
      } else {

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await userModel.create({ name, email, phonenumber, password: hashedPassword, isUser }).then(console.log("user created"))

        //node mailer
        const token = await new Token({
          userId: newUser._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();
        const url = `${process.env.BASE_URL}/user/${newUser._id}/verify/${token.token}`;
        await sendEmail(newUser.email, "verify Email", url);
        res.status(201).json({
          userId: newUser._id,
          created: true,
          message: "An email sent to your account, please verify",
          success: true
        });
      }

    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: errors.email, success: false });
    }
  },

  VerifyMail: async (req, res) => {
    try {
      const user = await userModel.findOne({ _id: req.params.id })
      if (!user) {
        return res.status(400).send({ message: "Invalid link" })
      }

      const token = await Token.findOne({
        userId: user._id,
        token: req.params.token
      })
      if (!token) return res.status(400).send({ message: "Invalid link" })

      await userModel.updateOne({ _id: user._id }, { verified: true })
      await token.deleteOne()

      res.status(200).send({ message: "Email Verified Successfully" })

    } catch (error) {
      return res.json({ error, message: "Internal server error", success: false });

    }
  },

  Login: async (req, res) => {
    try {
      const { password, email, isUser } = req.body;
      let userExist
      if (isUser === 'user') {
        userExist = await userModel.findOne({ email, isUser });
      } else if (isUser === 'club') {
        userExist = await clubModel.findOne({ email, isUser });
      }
      if (!userExist) {
        if (isUser === 'user') {
          return res.status(400).send({ message: "User does not exist", success: false });
        } else {
          return res.status(400).send({ message: "Club does not exist", success: false });
        }
      } else if (userExist.verified !== true) {
        return res.status(400).send({ message: "Please verify your account ", success: false });
      } else {
        const isPasswordValid = await bcrypt.compare(password, userExist.password);
        if (!isPasswordValid) {
          return res.status(400).send({ message: "Incorrect password", success: false });
        } else if (userExist.block === true) {
          return res.status(400).send({ message: "You are blocked", success: false });
        } else {
          let token
          if (isUser === 'user') {
            if (!userExist.verified) {
              return res.status(400).send({
                message:
                  "please verify your mail by clicking the link sent to your mail",
                success: false,
              });
            } else {
              token = jwt.sign({ userId: userExist._id }, process.env.JwtSecretKey, { expiresIn: '1day' })
            }
          } else {
            token = jwt.sign({ userId: userExist._id }, process.env.JwtClubSecretKey, { expiresIn: '1day' })
          }
          return res.status(200).send({ token: token, userExist: userExist, message: "Login successful", success: true });
        }
      }
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  Forgot: async (req, res) => {
    try {
      const { email, isUser } = req.body;

      const userExist = await userModel.findOne({ email });

      if (!userExist) {
        return res.status(400).send({ message: "user does'nt exists", success: false });

      }
      if (userExist.isGoogle === true) {
        return res.status(400).send({ message: "Can't get password,you are signed in with google", success: false });
      }
      //node mailer
      const token = await new Token({
        userId: userExist._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
      const url = `${process.env.BASE_URL}/user/${userExist._id}/forgotverify/${token.token}`;
      await sendEmail(userExist.email, "verify Email", url);
      res.status(201).json({
        userId: userExist._id,
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
      const { newpassword, token, userId } = req.body;
      const user = await userModel.findOne({ _id: userId });
      if (!user) {
        return res.status(400).send({ message: "Invalid link" });
      }
      const verifyToken = await Token.findOne({
        userId: user._id,
        token: token,
      });

      if (!verifyToken) {
        return res.status(400).send({ message: "Invalid link" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newpassword, salt);
      const updated = await userModel.updateOne(
        { _id: userId },
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

  GoogleSignup: async (req, res) => {
    try {
      const { id, name, email, isUser, isGoogle } = req.body;
      const userExist = await userModel.findOne({ email });
      if (userExist) {
        return res.status(400).send({ message: "User already exists", success: false });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(id, salt);
      const newUser = await userModel.create({ name, email, password: hashedPassword, isUser, isGoogle });

      return res.status(200).send({ message: "User created successfully", success: true });
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: errors.email, success: false });
    }
  },

  GoogleLogin: async (req, res) => {
    try {
      const { id, email, isUser } = req.body;
      let userExist
      userExist = await userModel.findOne({ email, isUser, isGoogle: true });
      if (!userExist) {
        return res.status(400).send({ message: "User does not exist", success: false });
      }
      const isPasswordValid = await bcrypt.compare(id, userExist.password);
      if (!isPasswordValid) {
        return res.status(400).send({ message: "Incorrect password", success: false });
      }
      const token = jwt.sign({ userId: userExist._id }, process.env.JwtSecretKey, { expiresIn: '1d' })

      return res.status(200).send({ token: token, userExist: userExist, message: "Login successful", success: true });
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  EditUserProfile: async (req, res) => {
    try {
      const { email, phonenumber, isUser, EmailId, name } = req.body;
      const oldUser = await userModel.findOne({ email: EmailId });

      if (email !== EmailId) {
        const user = await userModel.findOne({ email });
        if (user) {
          return res.status(400).send({ message: "Email already exists", success: false });
        }
      }
      //node mailer
      const token = await new Token({
        userId: oldUser._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
      const url = `${process.env.BASE_URL}/user/${oldUser._id}/verifytoedit/${token.token}`;
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

  VerifyEditUserProfile: async (req, res) => {
    try {
      const { data, token, userid } = req.body
      const user = await userModel.findOne({ _id: userid })
      if (!user) {
        return res.status(400).send({ message: "Invalid link" })
      }
      const verifytoken = await Token.findOne({
        userId: user._id,
        token: token
      })
      if (!verifytoken) return res.status(400).send({ message: "Invalid link" })

      await userModel.updateOne({ _id: user._id }, { isUser: data.isUser, email: data.email, name: data.name, phonenumber: data.phonenumber })
      const userExist = await userModel.findOne({ _id: user._id })
      await verifytoken.deleteOne()
      res.status(200).send({ userExist, message: "Email Verified Successfully", success: true })

    } catch (error) {
      return res.json({ error, message: "Internal server error", success: false });
    }
  },

  EditPassword: async (req, res) => {
    try {
      const { Password, NewPassword, PasswordConform, isUser, EmailId } = req.body;
      let userExist = await userModel.findOne({ email: EmailId, isUser });
      if (userExist) {
        const isPasswordValid = await bcrypt.compare(Password, userExist.password);
        if (!isPasswordValid) {
          return res.status(400).send({ message: "Incorrect password", success: false });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(NewPassword, salt);
        const user = await userModel.updateOne({ email: EmailId }, { $set: { password: hashedPassword } })
        if (user) {
          return res.status(200).send({ message: "Updated successfully", success: true });
        }
      }
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  GetAnnounced: async (req, res) => {
    try {
      // const details = await AnnounceModel.find({}).sort({ lastdate: -1 })
      const details = await AnnounceModel.aggregate([
        {
          $lookup: {
            from: 'clubs', // Replace with the actual name of the club collection
            localField: 'club',
            foreignField: '_id',
            as: 'clubData'
          }
        },
        {
          $unwind: '$clubData'
        },
        {
          $match: {
            'clubData.block': { $ne: true }
          }
        },
        {
          $sort: { lastdate: -1 }
        }
      ]);
      
     
      if (details) {
        res.status(200).json({ details, message: "Tournament announced ", success: true });
      }
    } catch (error) {
      const errors = handleErrors(error);
      return res.status(400).json({ errors, message: "Internal server error", success: false });

    }
  },

  TournamentShow: async (req, res) => {
    try {

      // const details = await Tournament.find({}).populate("club")
      const details = await Tournament.aggregate([
        {
          $match: {
            'block': { $ne: true }
          }
        },
        {
          $lookup: {
            from: 'clubs', // Assuming the name of the club collection is 'clubs'
            localField: 'club', // Field in Tournament collection
            foreignField: '_id', // Field in Club collection
            as: 'club'
          }
        },
        {
          $unwind: '$club'
        },
        {
          $match: {
            'club.block': { $ne: true }
          }
        },
        {
          $lookup: {
            from: 'clubs', // Assuming the name of the club collection is 'clubs'
            localField: 'club', // Field in Tournament collection
            foreignField: '_id', // Field in Club collection
            as: 'matchedClub'
          }
        }
      ]);


      if (details) {
        res.status(200).json({ details, message: "Tournament show successfully" });
      } else {
        res.status(400).json({ message: "No Tournaments Found" });
      }
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  ClubShow: async (req, res) => {
    try {
      const details = await clubModel.find({ block: { $ne: true } })
      if (details) {
        res.status(200).json({ details, message: "club show successfully", success: true });
      } else {
        res.status(400).json({ message: "No Clubs Found", success: false });
      }
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  PaymentLink: async (req, res) => {
    try {
      const {
        clubname,
        location,
        phonenumber,
        registration,
        announcementid,
        isUser,
        userId

      } = req.body
      let value = req.body
      const order = await AnnounceModel.findById(announcementid).populate('club');
      let amount = order.fee
      const datas = { ...order, isUser: isUser }

      if (amount <= 0) {
       
        try {
          const url = `${process.env.USER_API}/user/payment/${encodeURIComponent(JSON.stringify(value))}`
          res.send({ url: url });
        } catch (error) {
          res.status(500).send("Error occurred");
        }
      } else {
        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: 'inr',
                product_data: {
                  name: 'Vs Sports',

                },
                unit_amount: amount * 100,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',

          success_url: `${process.env.USER_API}/user/payment/${encodeURIComponent(JSON.stringify(value))}`,
          cancel_url: (isUser === 'user' ? `${process.env.BASE_URL}/user/failure?data=${encodeURIComponent(JSON.stringify(order))}` : `${process.env.BASE_URL}/club/failure?data=${encodeURIComponent(JSON.stringify(order))}`)

        });
        console.log(session,"session");
        console.log(session.payment_status,"status of session");

        res.send({ url: session.url ,status:session.payment_status,order:order});
      }
    } catch (error) {
      console.log(error);
    }
  },

  Payment: async (req, res) => {
    try {
      const { value } = req.params;
      const { clubname, location, phonenumber, registration, announcementid, isUser, userId, amount } = JSON.parse(value);
      try {
        const newTeam = await Teams.create({ teamname: clubname, location, phonenumber, registration, announcementid, userId, isUser, amount });
        const order = await AnnounceModel.findByIdAndUpdate(announcementid, { $inc: { teamsrequired: -1 } }, { new: true }).populate('club');
        const details = await AnnounceModel.aggregate([
          {
            $lookup: {
              from: 'clubs', // Replace with the actual name of the club collection
              localField: 'club',
              foreignField: '_id',
              as: 'clubData'
            }
          },
          {
            $unwind: '$clubData'
          },
          {
            $match: {
              'clubData.block': { $ne: true }
            }
          },
          {
            $sort: { lastdate: -1 }
          }
        ]);
        const datas = { ...details, isUser: isUser };

      console.log(datas,"datasdsd");
        res.status(202).send({order:datas});

        // res.redirect(isUser === 'user' ? (`${process.env.BASE_URL}/user/successpage?data=${encodeURIComponent(JSON.stringify(datas))}`) : (`${process.env.BASE_URL}/club/successpage?data=${encodeURIComponent(JSON.stringify(datas))}`))

      } catch (error) {
        res.status(500).send("Error occurred");
      }
    } catch (error) {
      res.status(500).send("Error occurred");
    }
  },

  TournamentMatches: async (req, res) => {
    try {
      const { id } = req.body
      const Id = new ObjectId(id)

      // const details = await MatchesModal.find({tournament:id}).populate('firstteam').populate('secondteam')
      const details = await MatchesModal.aggregate([
        {
          $match: {
            'tournament': Id
          }
        }, {
          $match: {
            'block':{ $ne: true }
          }
        },
        {
          $lookup: {
            from: 'tournaments', // Replace with the actual name of the tournament collection
            localField: 'tournament',
            foreignField: '_id',
            as: 'tournament'
          }
        },
        {
          $unwind: '$tournament'
        },
        {
          $lookup: {
            from: 'clubs', // Replace with the actual name of the club collection
            localField: 'tournament.club',
            foreignField: '_id',
            as: 'club'
          }
        },
        {
          $unwind: '$club'
        },
        {
          $match: {
            'club.block': { $ne: true }
          }
        },
        {
          $lookup: {
            from: 'teams', // Replace with the actual name of the teams collection
            localField: 'firstteam', // Assuming 'firstteam' is a reference to the team collection
            foreignField: '_id',
            as: 'firstteam'
          }
        },
        {
          $unwind: '$firstteam'
        },
        {
          $lookup: {
            from: 'teams', // Replace with the actual name of the teams collection
            localField: 'secondteam', // Assuming 'secondteam' is a reference to the team collection
            foreignField: '_id',
            as: 'secondteam'
          }
        },
        {
          $unwind: '$secondteam'
        }
      ]);

      res.status(200).json({ details, message: "Matches get successfully" });
    } catch (error) {
      res.status(500).send("Error occurred");
    }
  },

  TicketPayment: async (req, res) => {
    try {
      const {
        count,
        match,
        clubdatas,
        isUser,
      } = req.body
      let value = req.body
  
      const matchdata = await MatchesModal.findById({ _id: match._id }).populate('firstteam').populate('secondteam')
      let amount = matchdata.ticketsfee
      let available = matchdata.tickets
      const datas = { ...matchdata, isUser: isUser }
      if (available <= 0) {
        res.status(400).send("Ticket is not availble now")
      } else if (available < count) {
        res.status(402).send("Only few tickets is availble now")
      } else if (amount <= 0) {
        try {

          const url = `${process.env.USER_API}/user/paytickets/${encodeURIComponent(JSON.stringify(value))}`
          res.send({ url: url });

        } catch (error) {
          res.status(500).send("Error occurred");
        }
      } else {
        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: 'inr',
                product_data: {
                  name: 'Vs Sports',

                },
                unit_amount: amount * 100,
              },
              quantity: count,
            },
          ],
          mode: 'payment',

          success_url: `${process.env.USER_API}/user/paytickets/${encodeURIComponent(JSON.stringify(value))}`,
          cancel_url: (isUser === 'user' ? `${process.env.BASE_URL}/user/ticketsfailure?data=${encodeURIComponent(JSON.stringify({ isUser }))}` : `${process.env.BASE_URL}/club/ticketsfailure?data=${encodeURIComponent(JSON.stringify({ isUser }))}`)


        });
        res.send({ url: session.url });
      }
    } catch (error) {
      console.log(error);
    }
  },

  PayTickets: async (req, res) => {
    try {
      const { value } = req.params;
      const { count, match, clubdatas, isUser } = JSON.parse(value);

      let ticketId = []
      for (let i = 0; i < count; i++) {
        const ticket = `ticket_${uuidv4()}`
        ticketId.push(ticket)
      }
      try {
        const newTicket = await Tickets.create({
          isUser: isUser,
          match: match._id,
          userId: clubdatas.id,
          tickets: ticketId.map(ticket => ({ no: ticket }))
        });

        const matchdatas = await MatchesModal.findByIdAndUpdate(match._id, { $inc: { tickets: -count } }, { new: true }).populate('firstteam').populate('secondteam')
        const datas = { ...matchdatas, isUser: isUser, newTicket: newTicket };
        res.redirect(isUser === 'user' ? (`${process.env.BASE_URL}/user/ticketsuccesspage?data=${encodeURIComponent(JSON.stringify(datas))}`) : (`${process.env.BASE_URL}/club/ticketsuccesspage?data=${encodeURIComponent(JSON.stringify(datas))}`))

      } catch (error) {
        res.status(500).send("Error occurred");
      }
    } catch (error) {
      res.status(500).send("Error occurred");
    }
  },

  TicketGet: async (req, res) => {
    try {
      const datas = req.body
      const id = new ObjectId(datas.id)

      const tickets = await Tickets.find({ userId: id })
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
   
      res.status(200).json({ tickets, message: "tickets get successfully" });

    } catch (error) {
      res.status(500).send("Error occurred");
    }
  },

  Upcoming: async (req, res) => {
    try {
      const upcoming = await MatchesModal.aggregate([
        {
          $match: {
            'block': { $ne: true }
          }
        },
        {
          $lookup: {
            from: 'tournaments', // Replace with the actual name of the tournament collection
            localField: 'tournament',
            foreignField: '_id',
            as: 'tournament'
          }
        },
        {
          $unwind: '$tournament'
        },
        {
          $lookup: {
            from: 'clubs', // Replace with the actual name of the club collection
            localField: 'tournament.club',
            foreignField: '_id',
            as: 'club'
          }
        },
        {
          $unwind: '$club'
        },
        {
          $match: {
            'club.block': { $ne: true }
          }
        },
        {
          $lookup: {
            from: 'teams', // Replace with the actual name of the teams collection
            localField: 'firstteam', // Assuming 'firstteam' is a reference to the team collection
            foreignField: '_id',
            as: 'firstteam'
          }
        },
        {
          $unwind: '$firstteam'
        },
        {
          $lookup: {
            from: 'teams', // Replace with the actual name of the teams collection
            localField: 'secondteam', // Assuming 'secondteam' is a reference to the team collection
            foreignField: '_id',
            as: 'secondteam'
          }
        },
        {
          $unwind: '$secondteam'
        }
      ]).sort({date:1}).limit(5)

      // const upcoming = await MatchesModal.find({}).populate('firstteam').populate('secondteam').populate('tournament').sort({ date: 1 }).limit(5)
      res.status(200).json({ upcoming, message: "Matches get successfully" });

    } catch (error) {
      res.status(500).send("Error occurred");

    }
  },

  Auth: async (req, res) => {
    try {
      const token = req.headers["authorization"]?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          message: "User Authentication failed: Token not found",
          success: false,
        });
      }

      const secretKey = process.env.JwtSecretKey;

      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {

          return res.status(401).json({
            message: "User Authentication failed: Invalid token",
            success: false,
          });
        } else {
          userModel.findById({ _id: decoded.userId }).then((response) => {

            if (response.block) {
              return res.status(401).json({
                message: " Blocked",
                success: false,
              });
            } else {
              return res.status(200).json({
                message: "User Authentication success",
                success: true,
              });
            }
          })

        }
      });
    } catch (error) {
      return res.status(401).json({
        message: "User Authentication failed",
        success: false,
      });
    }
  }

}
