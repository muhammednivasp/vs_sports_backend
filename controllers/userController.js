
const userModel = require('../model/user');
const clubModel = require('../model/club');
const AnnounceModel = require('../model/announceTournament')
const Tournament = require('../model/tournament')
const Teams = require('../model/teams')
const MatchesModal = require('../model/matches')


const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt');
const Token = require("../model/token")
const sendEmail = require("../utils/sendEmail")
const crypto = require("crypto")
const Stripe = require('stripe');
const { log } = require('console');
const { Matches } = require('./clubController');
const stripe = Stripe('sk_test_51NUpC6SHhgXv6TRctUlfjdoCbOpHJooAQ3GgH2mpIjZkyQssWGZtelYDEVOgSOABVTeFkqZnJi5vPcr8yGAHG1dv00wWCyDJou')
require('dotenv').config();


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
      console.log("ethiee")
      const { password, name, email, phonenumber, isUser } = req.body;

      const userExist = await userModel.findOne({ email });
      if(userExist){ 
        if(userExist.isGoogle === false && userExist.verified === false){
        return res.status(400).send({ message: "Please verify your account", success: false });

       }else {
        return res.status(400).send({ message: "User already exists", success: false });
      }
     }else{

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = await userModel.create({ name, email, phonenumber, password: hashedPassword, isUser }).then(console.log("user created"))

      //node mailer
      const token = await new Token({
        userId: newUser._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
      const url = `${process.env.BASE_URL}user/${newUser._id}/verify/${token.token}`;
      await sendEmail(newUser.email, "verify Email", url);
      res.status(201).json({
        userId: newUser._id,
        created: true,
        message: "An email sent to your account, please verify",
        success: true
      });
    }

      // return res.status(200).send({ message: "User created successfully", success: true });
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

      await userModel.updateOne({_id: user._id},{ verified: true })
      await token.deleteOne()

      res.status(200).send({ message: "Email Verified Successfully" })

    } catch (error) {
      return res.json({ error, message: "Internal server error", success: false });

    }
  },

  Login: async (req, res) => {
    try {
      console.log("ioiooioi")
      const { password, email, isUser } = req.body;
      console.log(req.body)
      let userExist
      if (isUser === 'user') {
        console.log("ghgighi")
        userExist = await userModel.findOne({ email, isUser });
      } else if (isUser === 'club') {
        // console.log('jij')
        userExist = await clubModel.findOne({ email, isUser });
      }
      console.log(userExist, "kikii")
      if (!userExist) {
        if (isUser === 'user') {
          return res.status(400).send({ message: "User does not exist", success: false });
        } else {
          return res.status(400).send({ message: "Club does not exist", success: false });
        }
      } else if(userExist.verified!==true){
        return res.status(400).send({ message: "Please verify your account ", success: false });
      }else {
        const isPasswordValid = await bcrypt.compare(password, userExist.password);
        if (!isPasswordValid) {
          return res.status(400).send({ message: "Incorrect password", success: false });
        } else {
          console.log("liuy")
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
      console.log("ethiee")
      const { email, isUser } = req.body;
      console.log(req.body)

      const userExist = await userModel.findOne({ email });
      console.log(userExist, "loploplp")

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
      const url = `${process.env.BASE_URL}user/${userExist._id}/forgotverify/${token.token}`;
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
      console.log("ividend ")
      const { newpassword, token, userId } = req.body;
      console.log(req.body, "bodyiiiii");
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
      // console.log(req.body)
      const { id, name, email, isUser, isGoogle } = req.body;

      const userExist = await userModel.findOne({ email });

      if (userExist) {
        // console.log("jijijij")
        return res.status(400).send({ message: "User already exists", success: false });
      }
      //  console.log("hai")
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
      // console.log(req.body)
      let userExist
      userExist = await userModel.findOne({ email, isUser, isGoogle: true });
      //  console.log(userExist)
      if (!userExist) {
        // console.log("jdjdjd");
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
      console.log("edit user profile"),
        console.log(req.body, "body")
      const { email, phonenumber, isUser, EmailId, name } = req.body;
      console.log(req.body)
      const oldUser = await userModel.findOne({ email: EmailId });
      // const user = await userModel.findOne({email});
      // if (user && user._id.toString() !== oldUser._id.toString()) {
      // return res.status(400).send({ message: "Email already exist", success: false });
      //  }else{
      // const userExist = await userModel.updateOne({ email:EmailId }, { $set: { email:email,phonenumber:phoneNumber,name:name} })
      console.log("nan ethi")

      if (email !== EmailId) {
        console.log("nan ethi")
        const user = await userModel.findOne({ email });
        if (user) {
          return res.status(400).send({ message: "Email already exists", success: false });
        }
      }
      // console.log(oldUser._id)

      //node mailer
      const token = await new Token({
        userId: oldUser._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
      console.log("nan ethi")
      const url = `${process.env.BASE_URL}user/${oldUser._id}/verifytoedit/${token.token}`;
      await sendEmail(email, "verify Email", url);
      res.status(201).send({
        message: "An email sent to your account, please verify",
        success: false
      });
      // }
      // console.log(userExist,"kjjjjjjjjjikii")
      // if (userExist) {
      // const userData = await userModel.findOne({email});
      //     return res.status(200).send({userExist:userData,message: "Updated successfully", success: true });
      // }
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  VerifyEditUserProfile: async (req, res) => {
    try {
      const { data, token, userid } = req.body
      console.log("koikoikoi")
      const user = await userModel.findOne({ _id: userid })
      console.log(user)

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
      console.log(userExist, "exist")
      await verifytoken.deleteOne()

      res.status(200).send({ userExist, message: "Email Verified Successfully", success: true })

    } catch (error) {
      return res.json({ error, message: "Internal server error", success: false });

    }
  },

  EditPassword: async (req, res) => {
    try {
      console.log("ioiooioi")
      const { Password, NewPassword, PasswordConform, isUser, EmailId } = req.body;
      console.log(req.body)
      let userExist = await userModel.findOne({ email: EmailId, isUser });
      if (userExist) {
        const isPasswordValid = await bcrypt.compare(Password, userExist.password);
        if (!isPasswordValid) {
          return res.status(400).send({ message: "Incorrect password", success: false });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(NewPassword, salt);
        const user = await userModel.updateOne({ email: EmailId }, { $set: { password: hashedPassword } })

        console.log(user, "kjjjjjjjjjikii")
        if (user) {
          return res.status(200).send({ message: "Updated successfully", success: true });
        }
      }
    } catch (error) {
      const errors = handleErrors(error);
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },
  
  GetAnnounced:async(req,res)=>{
    try {
      const details = await AnnounceModel.find({}).sort({ lastdate: -1 })
      console.log(details,"dtdtdttd")
      if (details) {
        res.status(200).json({ details, message: "Tournament announced ",success: true });
    } 
  }catch (error) {
     const errors = handleErrors(error);
      return res.status(400).json({ errors, message: "Internal server error", success: false });
      
    }
  },

  TournamentShow:async(req,res)=>{
    try {
      // const { clubId } = req.body
      // console.log(req.body);
      console.log("ethiyooooopopopoo");
      const details = await Tournament.find({}).populate("club")
      // console.log(details,"ffggfgfgfg")
      if (details) {
        res.status(200).json({ details, message: "Tournament show successfully" });
      } else {
        res.status(400).json({ message: "No Tournaments Found" });
      }
    } catch (error) {
      const errors = handleErrors(error);
      console.log(error)
      return res.json({ errors, message: "Internal server error", success: false });
    }
  },

  ClubShow:async(req,res)=>{
    try {
    console.log("ethi");
    const details = await clubModel.find({})
    console.log(details,"ffggfgfgfg")
    if (details) {
      res.status(200).json({ details, message: "club show successfully",success: true  });
    } else {
      res.status(400).json({ message: "No Clubs Found" ,success: false});
    }
  } catch (error) {
    const errors = handleErrors(error);
    console.log(error)
    return res.json({ errors, message: "Internal server error", success: false });
  }
  },

  PaymentLink: async (req, res) => {
    console.log('llldfdsffewfefewfwewer12344');
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
      console.log(req.body,"klklk;kl");
        let value = req.body
        // const {orderId} = req.params;
       
       console.log('ethiy0')
        
        const order = await AnnounceModel.findById(announcementid).populate('club');
        log(order,"orderlller")
        let amount = order.fee
        const datas =  { ...order, isUser : isUser }
        
        if (amount <= 0) {
          console.log(value, "loploplopl");
       
          console.log(location, clubname, "hoihoi");
          try {
            // const newTeam = await Teams.create({ teamname: clubname, location, phonenumber, registration, announcementid, userId, isUser, amount });
            // console.log("created");
            // const order = await AnnounceModel.findByIdAndUpdate(announcementid, { $inc: { teamsrequired: -1 } }, { new: true }).populate('club');
            // const datas = { ...order, isUser : isUser };
            // console.log(order, "jijijiji");
            // console.log(datas, "klkoklkl");
            // console.log(process.env.BASE_URL, "url");
           const url =  `${process.env.USER_API}/user/payment/${encodeURIComponent(JSON.stringify(value))}`
           res.send({ url:url });
          // return res.status(202).json({order});
      
          } catch (error) {
            console.error(error);
            res.status(500).send("Error occurred");
          }

        }else{
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name:'Vs Sports',
                          
                        },
                        unit_amount: amount*100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',

            success_url:`${process.env.USER_API}/user/payment/${encodeURIComponent(JSON.stringify(value))}`,
            // cancel_url: `${process.env.BASE_URL}/user/failure`,
            // cancel_url: (isUser === 'user' ? (`${process.env.BASE_URL}/user/failure?data=${encodeURIComponent(JSON.stringify(datas))}`) : (`${process.env.BASE_URL}/club/failure?data=${encodeURIComponent(JSON.stringify(datas))}`))
            cancel_url: (isUser === 'user' ? `${process.env.BASE_URL}/user/failure?data=${encodeURIComponent(JSON.stringify({ isUser }))}` : `${process.env.BASE_URL}/club/failure?data=${encodeURIComponent(JSON.stringify({ isUser }))}`)


        });
        console.log(session,"llllllkkkkkklllllllllllll");
        res.send({ url: session.url });
      }
    } catch (error) {
        console.log(error);
    }
},

Payment: async (req, res) => {
  try {
    console.log("hisisisi");
    const { value } = req.params;
    console.log(value, 'valaa');
    const { clubname, location, phonenumber, registration, announcementid, isUser, userId, amount } = JSON.parse(value);
    console.log(location, clubname, "hoihoi");
    try {
      const newTeam = await Teams.create({ teamname: clubname, location, phonenumber, registration, announcementid, userId, isUser, amount });
      console.log("created");
      const order = await AnnounceModel.findByIdAndUpdate(announcementid, { $inc: { teamsrequired: -1 } }, { new: true }).populate('club');
      const datas = { ...order, isUser : isUser };
      console.log(order, "jijijiji");
      console.log(datas, "dfdfdf");

      res.redirect(isUser === 'user' ? (`${process.env.BASE_URL}/user/successpage?data=${encodeURIComponent(JSON.stringify(datas))}`) : (`${process.env.BASE_URL}/club/successpage?data=${encodeURIComponent(JSON.stringify(datas))}`))

    } catch (error) {
      console.error(error);
      res.status(500).send("Error occurred");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred");
  }
},

TournamentMatches:async(req,res)=>{
  try {
    console.log("gg");
    console.log(req.body);
    const {id} = req.body
    const details = await MatchesModal.find({tournament:id}).populate('firstteam').populate('secondteam')
   console.log(details,"det");

   res.status(200).json({details, message: "Matches get successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred");
  }
}
}
