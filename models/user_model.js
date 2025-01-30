const {Schema, model, mongoose} = require("mongoose");

const user_Schema = Schema({
    _id: Schema.Types.ObjectId,
    email : { type: String, unique: true, required: true },
    password: { type: String, required: true },
    orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
});

const User = mongoose.model('User', user_Schema);

module.exports = { User }