const router = require('express').Router()
const { Login, GetAnnounced, TournamentShow ,ClubShow,PaymentLink,TournamentMatches} = require('../controllers/userController')
const { ClubSignup, EditClub, ChangePassword, VerifyClubMail, VerifyEditProfile, Forgot, VerifyForgotMail, AnnounceTournament, Announced, 
    EditAnnounceTournament, AddNewTournament, Tournament, EditTournament ,Limit,Details,TeamManual,AnnounceToTournament,TeamGet,MatchPost,
    Matches,EditMatchPost,ClubMatches,ScoreChange} = require('../controllers/clubController')
const { clubAuthentication } = require('../middleware/clubAuthmiddleware')

// console.log(router)
router.post('/login', Login)
router.post('/clubsignup', ClubSignup)
router.get('/club/:id/verify/:token', VerifyClubMail)
router.post('/clubforgot', Forgot)
router.patch('/forgotpassword', VerifyForgotMail)




router.patch('/editclubprofile', clubAuthentication, EditClub)
router.patch('/verifyeditclubprofile', clubAuthentication, VerifyEditProfile)


router.patch('/clubpassword', clubAuthentication, ChangePassword)
router.post('/announcetournament', clubAuthentication, AnnounceTournament)
router.post('/announce', clubAuthentication, Announced)
router.patch('/announcetournament', clubAuthentication, EditAnnounceTournament)

router.get('/announced', clubAuthentication, GetAnnounced)
router.post('/addtournament', clubAuthentication, AddNewTournament)
router.post('/tournament', clubAuthentication, Tournament)
router.patch('/addtournament', clubAuthentication, EditTournament)
router.get('/tournament', clubAuthentication, TournamentShow)
router.get('/clubs', clubAuthentication, ClubShow)
router.post('/payment',clubAuthentication, PaymentLink)
router.post('/limit', clubAuthentication, Limit)
router.post('/details', clubAuthentication, Details)
router.post('/addteammanual', clubAuthentication, TeamManual)
router.post('/addtotournament', clubAuthentication, AnnounceToTournament)
router.post('/teamget', clubAuthentication, TeamGet)
router.post('/matchpost', clubAuthentication, MatchPost)
router.patch('/editmatchpost', clubAuthentication, EditMatchPost)
router.post('/matches', clubAuthentication, Matches)
router.post('/clubmatches', clubAuthentication, ClubMatches)
router.post('/tournamentmatches', clubAuthentication, TournamentMatches)
router.post('/scorechange', clubAuthentication, ScoreChange)

























module.exports = router