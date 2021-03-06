const express = require('express'); 
const router = express.Router(); 
const auth = require('../../middleware/auth'); 
const Profile = require('../../models/Profile'); 
const User = require('../../models/User'); 
const { check, validationResult } = require('express-validator'); 
const request = require('request'); 
// require('dotenv').config();
const config = require('config'); 

//GET user's profile  
router.get('/me', auth, async (req, res) => {
     try {
         //find profile by user's id and include the name and avatar from the user model 
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']); 

        //if there is no profile, send an error message 
        if(!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user.'}); 
        }

        res.send(profile); 
     } catch (err) {
         console.error(err.message); 
         res.status(500).send('Server error.'); 
     }
}); 

//Create new or update old profile 
router.post('/', [ auth,
    check('status', 'Status is required.').not().isEmpty(),  
    check('skills', 'Skills is required.').not().isEmpty(), 
  ], async (req, res) => {
    const errors = validationResult(req); 

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() }); 
    }

    //we are destructuring what we need out of the requested data 
    const {
        company, 
        website, 
        location, 
        bio, 
        status, 
        githubusername, 
        skills,
        youtube, 
        facebook, 
        twitter,
        instagram, 
        linkedin
    } = req.body; 

    //create empty object to store the data 
    const profileFields = {}; 

    //sets the user to the user id from the request data 
    profileFields.user = req.user.id;

    //create checks for the incomming data 
    if(company) {
        profileFields.company = company; 
    }
    if(website) {
        profileFields.website = website; 
    }
    if(location) {
        profileFields.location = location; 
    }
    if(bio) {
        profileFields.bio = bio; 
    }
    if(status) {
        profileFields.status = status; 
    }
    if(githubusername) {
        profileFields.githubusername = githubusername; 
    }
    if(skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim()); 
    }
    // console.log(profileFields.skills); 
    
    //build social object 
    profileFields.social = {}; 

    if(youtube) {
        profileFields.social.youtube = youtube; 
    }
    if(facebook) {
        profileFields.social.facebook = facebook; 
    }
    if(twitter) {
        profileFields.social.twitter = twitter; 
    }
    if(instagram) {
        profileFields.social.instagram = instagram; 
    }
    if(linkedin) {
        profileFields.social.linkedin = linkedin; 
    }

    try {
        let profile = await Profile.findOne({ user: req.user.id }); 

        if (profile) {
            //Update the profile
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id }, 
                { $set: profileFields }, 
                { new: true }
            ); 

            return res.json(profile); 
        }

        //Create a new profile 
        profile = new Profile(profileFields); 
        await profile.save(); 
        res.json(profile); 

    } catch (err) {
        console.error(err.message); 
        res.status(500).send("Server Error"); 
    }
}); 

//GET all profiles
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']); 
        res.json(profiles); 

    } catch (err) {
        console.error(err.message); 
        res.status(500).send('Server Error'); 
    }
}); 

//GET profile by User ID
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']); 
        if(!profile) {
            return res.status(400).json({ msg: 'Profile not found.' }); 
        }
        res.json(profile); 
    } catch (err) {
        console.error(err.message); 

        //if the params is still an id, then... 
        if(err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found.' }); 
        }
        res.status(500).send('Server Error'); 
    }
}); 

//Delete a User, their profile, and posts
router.delete('/', auth, async (req, res) => {
    try {
        await Profile.findOneAndRemove({ user: req.user.id }); 
        await User.findOneAndRemove({ _id: req.user.id }); 

        res.json({ msg: "User was removed." }); 

    } catch (err) {
        console.error(err.message); 
        res.status(500).send('Server Error'); 
    }
}); 

//Add Education fields to profile 
router.put('/experience', [auth, [
    check('title', "Title is required.").not().isEmpty(), 
    check('company', "Company is required.").not().isEmpty(), 
    check('from', "From date is required.").not().isEmpty(), 
]], async (req, res)=> {
    const errors = validationResult(req); 
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() }); 
    }

    const {
        title,
        company, 
        location,
        from,
        to,
        current,
        description
    } = req.body; 

    const newExp = {
        title,
        company, 
        location, 
        from,
        to, 
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id }); 
        profile.experience.unshift(newExp); 
        await profile.save(); 
        res.json(profile); 

    } catch (err) {
        console.error(err.message); 
        res.status(500).send('Server Error'); 
    }
}); 

//Delete an Experience 
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        //we are finding the profile using profile id
        const profile = await Profile.findOne({ user: req.user.id });  
        //we are mapping through the array to find the index of an experince id that matches the one in params
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id); 
        //we use the index# to then remove it from the array
        profile.experience.splice(removeIndex, 1); 

        await profile.save(); 
        res.json(profile); 
        console.log("Experience was removed."); 

    } catch (err) {
        console.error(err.message); 
        res.status(500).send('Server Error'); 
    }
}); 

//Add Education to our profile
router.put('/education', [auth, [
    check('school', "School is required.").not().isEmpty(), 
    check('degree', "Degree is required.").not().isEmpty(), 
    check('fieldofstudy', "Field of Study is required.").not().isEmpty(), 
    check('from', "From Date is required.").not().isEmpty(), 
]], async (req, res)=> {
    const errors = validationResult(req); 
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() }); 
    }

    const {
        school,
        degree, 
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body; 

    const newEdu = {
        school,
        degree, 
        fieldofstudy, 
        from,
        to, 
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id }); 
        profile.education.unshift(newEdu); 
        await profile.save(); 
        res.json(profile); 

    } catch (err) {
        console.error(err.message); 
        res.status(500).send('Server Error'); 
    }
}); 

//Delete an Education 
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        //we are finding the profile using profile id
        const profile = await Profile.findOne({ user: req.user.id });  
        //we are mapping through the array to find the index of an experince id that matches the one in params
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id); 
        //we use the index# to then remove it from the array
        profile.education.splice(removeIndex, 1); 

        await profile.save(); 
        res.json(profile); 
        console.log("Education was removed.")

    } catch (err) {
        console.error(err.message); 
        res.status(500).send('Server Error'); 
    }
}); 

//Get User's Github Repos 
router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`, 
            method: 'GET', 
            headers: { 'user-agent': 'node.js' }
        }; 
        request(options, (error, response, body) => {
            if (error) {
                console.error(error); 
            }
            //if the statuscode is not ok, then... 
            if(response.statusCode !== 200) {
                return res.status(404).json({ msg: 'No Github profile found.'}); 
            }

            res.json(JSON.parse(body)); 
        })
    } catch (err) {
        console.error(err.message); 
        res.status(500).send('Server Error'); 
    }
}); 


module.exports = router; 