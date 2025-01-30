const AdminRouter = require('express').Router()

AdminRouter.use('/user', require('./user'))

module.exports = AdminRouter