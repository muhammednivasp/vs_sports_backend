// const adminModel = require('../model/admin');
// const jwt = require("jsonwebtoken")
// // const crypto = require("crypto")
// // const mongoose = require('mongoose');
// // const { ObjectId } = mongoose.Types;

// const bcrypt = require('bcrypt');
// require('dotenv').config();


// module.exports = {
// Login:async()=>{
//     try {
//       console.log("llr");
//         const { password, email } = req.body;
//         console.log(req.body)
       
//         let  adminExist = await adminModel.findOne({ email });
//         console.log(adminExist, "kikii")
//         if (!adminExist) {
//             return res.status(400).send({ message: "You are not a admin", success: false });
//         } else {
//           const isPasswordValid = await bcrypt.compare(password, adminExist.password);
//           if (!isPasswordValid) {
//             return res.status(400).send({ message: "Incorrect password", success: false });
//           } else {
//             let token = jwt.sign({ adminId: adminExist._id }, process.env.JwtAdminSecretKey, { expiresIn: '1day' })
//             return res.status(200).send({ token: token, adminExist: adminExist, message: "Login successful", success: true });
//           }
//         }
//     }catch (error) {
//             console.log(error);
//         return res.json({ error, message: "Internal server error", success: false });
//     }

//     }
// }

const adminModel = require('../model/admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const clubModel = require('../model/club');



require('dotenv').config();

module.exports = {
  Login: async (req, res) => {
    try {
      const { password, email } = req.body;
      console.log(req.body);

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
      console.log(error);
      return res.json({ error, message: "Internal server error", success: false });
    }
  },
  Club:async(req,res)=>{
    console.log("lo-ploll");
    let club = await clubModel.find({});
    console.log(club);
    return res.status(200).send({ club,message: "data get successful", success: true });


  }
};
