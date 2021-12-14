const express = require('express'); 
const router = express.Router(); 
const { check, validationResult } = require('express-validator'); 
const User = require('../../models/User'); 
const gravatar = require('gravatar'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const config = require('config'); 

// Register new User 
router.post('/', [
    //this is adding validation to make sure that the name field is not empty
    check('name', 'Name is required').not().isEmpty(), 
    check('email', 'Please include a valid email').isEmail(), 
    check('password', "Please enter a password with 6 or more characters").isLength({ min: 6 }), 
],  async (req, res) => {
    // console.log(req.body); 
    const errors = validationResult(req); 

    //if there are errors, then send back a bad request status(400)
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors:errors.array() }); 
    }

    const { name, email, password } = req.body; 
    try {
        //see if user exists 
        let user = await User.findOne({ email }); 
        if (user) {
            return res.status(400).json({ errors:[{ msg: 'User already exists'}] }); 
        }

        //Get user's gravatar 
        const avatar = gravatar.url(email, {
            s: '200', 
            r: 'pg', 
            d: 'mm'
        })

        // Encrypt the password 
        user = new User({
            name, 
            email, 
            avatar, 
            password
        }); 

        const salt = await bcrypt.genSalt(10); 
        user.password = await bcrypt.hash(password, salt); 

        //save the user to the db 
        await user.save(); 

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

        // res.send('User registered!'); 

    } catch (err) {
        console.error(err.message); 
        res.status(500).send('Server error'); 
    }

    // res.send('User route'); 
}); 

module.exports = router; 