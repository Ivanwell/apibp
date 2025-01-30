const {Schema, model, mongoose} = require("mongoose");

const item_whole_Schema = Schema({
  _id: String,
  brand: String,
  brandShort : String,
  title: String,
  unicTitle: String,
  image : String,
  article : String,
  categoryName : String,
  discription : String,
  supliers: [{ type: Schema.Types.ObjectId, ref: 'Item_direct' }],
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  link: [{ type: Schema.Types.ObjectId, ref: 'Link' }]
});
const categories_Schema = Schema({
  _id: String,
  name : String,
  fullPath : [{
      eng : String,
      ukr : String
  }],
  link : String,
  categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  relatedArticles: [{ type: Schema.Types.ObjectId, ref: 'Article_page' }]
});
const item_direct_Schema = Schema({
    _id: Schema.Types.ObjectId,
    price : Number,
    amount : String,
    suplierID : String,
    article : String,
    lastDate : String,
    brand : String,
    itemWhole : { type: Schema.Types.ObjectId, ref: 'Item_whole' }
});
const link_Schema = Schema({
    _id: Schema.Types.ObjectId,
    link : String
});
const review_Schema = Schema({
  _id: String,
  person: String,
  message : String,
  stars: String,
  createdDate : {
       type: Date,
       default: new Date()
   },
   date: String,
   main : Boolean,
   comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
});
const comment_Schema = Schema({
    _id: Schema.Types.ObjectId,
    message : String,
    person : String,
    date : String,
    createdDate : {
       type: Date,
       default: new Date()
   },
});
const article_page_Schema = Schema({
  _id: String,
  title : String,
  text: String,
  date: String,
  link: String,
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
});
const order_Schema = Schema({
  _id: String,
  id: Number,
  delivery: Object,
  products: Array,
  date: {
    type: Date,
    default: new Date(),
  },
})

const Review = mongoose.model('Review', review_Schema);
const Comment = mongoose.model('Comment', comment_Schema);
const Item_direct = mongoose.model('Item_direct', item_direct_Schema);
const Item_whole = mongoose.model('Item_whole', item_whole_Schema);
const Link = mongoose.model('Link', link_Schema);
const Category = mongoose.model('Category', categories_Schema);
const Article_page = mongoose.model('Article_page', article_page_Schema);
const Order = mongoose.model('Order', order_Schema)

module.exports = { Item_whole, Item_direct, Category, Review, Link, Comment, Article_page, Order }