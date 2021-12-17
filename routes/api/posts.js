const express = require('express'); 
const router = express.Router(); 
const { check, validationResult } = require('express-validator'); 
const auth = require('../../middleware/auth'); 
const User = require('../../models/User'); 
const Profile = require('../../models/Profile'); 
const Post = require('../../models/Post'); 

//create new post 
router.post('/', [auth, [
    check('text', 'Text is required.').not().isEmpty(),
]], async (req, res) => {

    const errors = validationResult(req); 
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() }); 
    }

    try {
        //find user by id and exclude the password 
        const user = await User.findById(req.user.id).select('-password'); 

        const newPost = new Post ({
            text: req.body.text, 
            name: user.name, 
            avatar: user.avatar, 
            user: req.user.id, 
        }); 

        const post = await newPost.save(); 
        res.json(post); 

    } catch (err) {
        console.error(err.message); 
        res.status(500).send("Server Error"); 
    } 
}); 

//Get all posts 
router.get('/', auth, async (req, res) => {
    try {
        //this sorts by the newest date
        const posts = await Post.find().sort({ date: -1 }); 
        res.json(posts); 
    } catch (err) {
        console.error(err.message); 
        res.status(500).send("Server Error"); 
    }
}); 

module.exports = router; 