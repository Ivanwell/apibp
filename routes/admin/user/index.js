const ApiUserRouter = require('express').Router()
const {CreateUser, Login} = require('./user.js')

ApiUserRouter.route('/createUser').post(CreateUser)
ApiUserRouter.route('/login').post(Login)
    
module.exports = ApiUserRouter