const express = require('express'); 
const router = express.Router(); 
const auth = require('../../middleware/auth'); 
const User = require('../../models/User'); 
const { check, validationResult } = require('express-validator'); 
const config = require('config'); 
// require('dotenv').config();
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcryptjs'); 

//GET route 
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); 
        res.json(user); 
    } catch (err) {
        console.error(err.message); 
        res.status(500).send('Server error'); 
    }
}); 

// Authenticate new User & get token 
router.post('/', [
    //this is adding validation to make sure that the name field is not empty
    check('email', 'Please include a valid email').isEmail(), 
    check('password', "Password is required.").exists(), 
],  async (req, res) => {
    // console.log(req.body); 
    const errors = validationResult(req); 

    //if there are errors, then send back a bad request status(400)
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors:errors.array() }); 
    }

    const { email, password } = req.body; 
    try {
        //see if user exists 
        let user = await User.findOne({ email }); 
        if (!user) {
            return res.status(400).json({ errors:[{ msg: 'Invalid Credentials'}] }); 
        }

        //check to see if passwords are the same 
        const isMatch = await bcrypt.compare(password, user.password); 

        //if there is no match, then 
        if (!isMatch) {
            return res.status(400).json({ errors:[{ msg: 'Invalid Credentials'}] }); 
        }

        //return jsonwebtoken 
        const payload = { 
            user: {
                id: user.id 
            }
        }; 

        jwt.sign(payload, config.get('secret'), { expiresIn: '2h' }, (err, token) => {
            if (err) {
                throw err; 
            }
            res.json({ token }); 
        });

    } catch (err) {
        console.error(err.message); 
        res.status(500).send('Server error'); 
    }
}); 

module.exports = router; 