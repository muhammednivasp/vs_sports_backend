
const router = require('express').Router()
const { Signup, Login, GoogleSignup, GoogleLogin, EditUserProfile, EditPassword, VerifyMail, VerifyEditUserProfile, Forgot, VerifyForgotMail, GetAnnounced, 
    TournamentShow ,ClubShow,PaymentLink,Payment,TournamentMatches,TicketPayment,PayTickets,TicketGet,Upcoming,Auth} = require('../controllers/userController')
const { userAuthentication } = require('../middleware/authMiddleware')

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
router.post('/paymentsuccess', Payment)
router.post('/tournamentmatches',userAuthentication, TournamentMatches)
router.post('/ticketpayment',userAuthentication, TicketPayment)
router.post('/ticketpaymentsuccess', PayTickets)
router.post('/ticketget',userAuthentication,TicketGet)
router.get('/upcoming',userAuthentication,Upcoming)
router.post('/auth',Auth)

module.exports = router