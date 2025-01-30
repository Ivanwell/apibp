const ApiProductRouter = require('express').Router()
const { GetUser } = require('./users.js')

ApiProductRouter.route('/get_user').post(GetUser)
    
module.exports = ApiProductRouter