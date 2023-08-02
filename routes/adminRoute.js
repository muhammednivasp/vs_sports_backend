const express = require('express');
const router = express.Router();

const { Login ,Club } = require('../controllers/adminController');

router.post('/login', Login);
router.get('/club', Club);


module.exports = router;
