const  { User }  = require('../../../models/user_model.js')

const GetUser = async function (req, res, next) {
    
    try{
        
        const password = req.body.password
        const username = req.body.username
        
        const user = await User.findOne({username : username, password : password})
        
        if (user){
            res.status(200).json(user);
        } else {
             res.status(400).json(user);
        }
    
    }catch(error){
        
        res.status(500).json('error');
        
    }
}

module.exports = { GetUser }
    

