const express = require('express');
const router = express.Router();

const { Login ,Club ,Block ,User ,UserBlock ,Tournaments ,BlockTournaments ,Matches ,BlockMatches ,UsersCount,ClubsCount,TournamentCount,MatchesCount,TeamsCount} = require('../controllers/adminController');

router.post('/login', Login);
router.get('/club', Club);
router.post('/block', Block);
router.get('/user', User);
router.post('/userblock', UserBlock);
router.get('/tournaments', Tournaments);
router.post('/tournaments', BlockTournaments);
router.get('/matches', Matches);
router.post('/matches', BlockMatches);
router.get('/userscount',UsersCount)
router.get('/clubscount',ClubsCount)
router.get('/tournamentscount',TournamentCount)
router.get('/matchescount',MatchesCount)
router.get('/teamscount',TeamsCount)



module.exports = router;
