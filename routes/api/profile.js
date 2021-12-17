const express = require('express'); 
const router = express.Router(); 
const auth = require('../../middleware/auth'); 
const Profile = require('../../models/Profile'); 
const User = require('../../models/User'); 
const { check, validationResult } = require('express-validator'); 


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

module.exports = router; 