const {User} = require('../../../models/user_model.js')
const bcrypt = require('bcrypt');
 const jwt = require('jsonwebtoken');
 const { mongoose} = require("mongoose");

const CreateUser = async function (req, res, next) {
    const data = await User.find({})
    
    try {
         const { email , password } = req.body;
         const checkUniq = await User.findOne({ email });
         if (checkUniq){
             res.status(200).json( {result : 'failed',message: "Цей e-mail вже зареєстрований"} );
         }
         
         const saltRounds = 10;
         const hashedPassword = await bcrypt.hashSync(password, saltRounds);
         const user = new User({ _id : new mongoose.Types.ObjectId(), email, password: hashedPassword });
         await user.save();
         res.status(201).json({result : 'success', message: "Реєстрація успішна"});
    } catch (error) {
         res.status(500).json( {result : 'failed',message: "Помилка реєстрації", error : error.message, data } );
    }
}

const Login = async function (req, res, next) {
    
    try {
         const { email, password } = req.body;
         const user = await User.findOne({ email : email });
         if (!user) {
         return res.status(401).json({ error: 'There is no such user' });
         }
         const passwordMatch = await bcrypt.compare(password, user.password);
         if (!passwordMatch) {
         return res.status(401).json({ error: 'Password is incorrect' });
         }
         const token = jwt.sign({ userId: user._id }, 'your-secret-key', {
            expiresIn: 60000,
         });
 
         res.status(201).json({token});
    } catch (error) {
         res.status(500).json( "Login process failed" );
    }
}

module.exports = {CreateUser, Login}