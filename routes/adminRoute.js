const express = require('express');
const router = express.Router();

const { Login ,Club ,Block ,User ,UserBlock ,Tournaments ,BlockTournaments ,Matches ,BlockMatches ,UsersCount,ClubsCount} = require('../controllers/adminController');

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









module.exports = router;
