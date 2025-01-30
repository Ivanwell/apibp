const ApiRouter = require('express').Router()

ApiRouter.use('/info', require('./info'))
ApiRouter.use('/auth', require('./auth'))

module.exports = ApiRouter