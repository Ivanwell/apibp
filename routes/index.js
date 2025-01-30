const Api = function(app){
    app.use('/api', require('./api'));
}

const Admin = function(app){
    app.use('/admin', require('./admin'));
}

module.exports = {Api, Admin}