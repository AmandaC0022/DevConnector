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

//Get a single post by id 
router.get('/:id', auth, async (req, res) => {
    try {
        //this sorts by the newest date
        const post = await Post.findById(req.params.id); 

        //if no post is found, then...
        if(!post) {
            return res.status(404).json({ msg: "Post not found." }); 
        }

        res.json(post); 
    } catch (err) {

        if(err.kind == 'ObjectId') {
            return res.status(404).json({ msg: "Post not found." }); 
        }
        console.error(err.message); 
        res.status(500).send("Server Error"); 
    }
}); 

//Delete a post 
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id); 

        //check to see if user is the post's creator
        if(post.user.toString() !== req.user.id){
            return res.status(401).json({ msg: 'User not authorized'}); 
        }

        //if the post doesn't exist, then... 
        if(!post) {
            return res.status(404).json({ msg: "Post not found." }); 
        }

        await post.remove(); 
        res.json({ msg: "Post was removed." }); 
    } catch (err) {
        if(err.kind == 'ObjectId') {
            return res.status(404).json({ msg: "Post not found." }); 
        }
        console.error(err.message); 
        res.status(500).send("Server Error"); 
    }
});

//like a post
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id); 

        //Check if the post has already been liked by user 
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(404).json({ msg: "Post has already been liked."}); 
        }; 

        //add user to the likes 
        post.likes.unshift({ user: req.user.id }); 
        //save it 
        await post.save(); 
        res.json(post.likes); 
    } catch (err) {
        console.error(err.message); 
        res.status(500).send("Server Error"); 
    }
}); 

//Unlike a Post
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id); 

        //Check if the post has already been liked by user 
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(404).json({ msg: "Post has not been liked."}); 
        }; 

        //get remove index 
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id); 
        post.likes.splice(removeIndex, 1); 
         
        //save it 
        await post.save(); 
        res.json(post.likes); 
    } catch (err) {
        console.error(err.message); 
        res.status(500).send("Server Error"); 
    }
}); 

//create new comment for post  
router.post('/comment/:id', [auth, [
    check('text', 'Text is required.').not().isEmpty(),
]], async (req, res) => {

    const errors = validationResult(req); 
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() }); 
    }

    try {
        //find user by id and exclude the password 
        const user = await User.findById(req.user.id).select('-password'); 
        const post = await Post.findById(req.params.id); 

        const newComment = {
            text: req.body.text, 
            name: user.name, 
            avatar: user.avatar, 
            user: req.user.id, 
        }; 
        post.comments.unshift(newComment); 

        await post.save(); 
        res.json(post.comments); 

    } catch (err) {
        console.error(err.message); 
        res.status(500).send("Server Error"); 
    } 
}); 

//Delete a comment 
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id); 
        //get the comment from the post 
        const comment = post.comments.find(comment => comment.id === req.params.comment_id); 

        //Make sure comment exists 
        if(!comment) {
            return res.status(404).json({ msg: 'Comment not found.' }); 
        }; 

        //check user 
        if(comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized.' }); 
        }
        
        //get remove index 
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id); 
        post.comments.splice(removeIndex, 1); 

        await post.save(); 
        res.json(post.comments); 

    } catch (err) {
        if(err.kind == 'ObjectId') {
            return res.status(404).json({ msg: "Post not found." }); 
        }
        console.error(err.message); 
        res.status(500).send("Server Error"); 
    }
});

module.exports = router; 