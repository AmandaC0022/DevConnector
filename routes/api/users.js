const express = require('express'); 
const router = express.Router(); 

//test GET route 
router.get('/', (req, res) => {
    res.send('User route'); 
}); 

module.exports = router; 