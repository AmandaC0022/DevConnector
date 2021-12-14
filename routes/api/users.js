const express = require('express'); 
const router = express.Router(); 

// Register new User 
router.post('/', (req, res) => {
    console.log(req.body); 
    res.send('User route'); 
}); 

module.exports = router; 