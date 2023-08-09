
// const express = require('express')
// const router = express.Router()
const router = require('express').Router()
const { Signup, Login, GoogleSignup, GoogleLogin, EditUserProfile, EditPassword, VerifyMail, VerifyEditUserProfile, Forgot, VerifyForgotMail, GetAnnounced, 
    TournamentShow ,ClubShow,PaymentLink,Payment,TournamentMatches,TicketPayment,PayTickets,TicketGet} = require('../controllers/userController')
const { userAuthentication } = require('../middleware/authMiddleware')

// console.log(router)
router.post('/signup', Signup)
router.get('/user/:id/verify/:token', VerifyMail)
router.patch('/forgotpassword', VerifyForgotMail)


router.post('/login', Login)
router.post('/forgot', Forgot)

router.post('/googlesignup', GoogleSignup)
router.post('/googlelogin', GoogleLogin)
router.patch('/userprofile', userAuthentication, EditUserProfile)
router.patch('/edituserprofile', userAuthentication, VerifyEditUserProfile)

router.patch('/userpassword', userAuthentication, EditPassword)

router.get('/announced', userAuthentication, GetAnnounced)
router.get('/tournament', userAuthentication, TournamentShow)
router.get('/clubs', userAuthentication, ClubShow)
router.post('/payment',userAuthentication, PaymentLink)
router.get('/payment/:value', Payment)
router.post('/tournamentmatches',userAuthentication, TournamentMatches)
router.post('/ticketpayment',userAuthentication, TicketPayment)
router.get('/paytickets/:value', PayTickets)
router.post('/ticketget',userAuthentication,TicketGet)









// router.post('/signup',signup)
module.exports = router