const { Review, Item_whole, Comment } = require('../../../models/models.js')
const mongoose = require('mongoose')

const GetReviews = async function (req, res, next) {
        
        const amount = +req.query.step*6
        
        try {
            const reviews = await Review.find({main : true}).limit(amount).sort({createdDate:-1})
            res.status(200).json(reviews);
        }catch(error){
                res.status(500).json(error.message);
        }
}

const AddReview = async function (req, res, next) {
        
    const review = req.body.review
    const creating = await createReview(review, true)
    
    res.status(200).json('success');
}

const AddReviewToProduct = async function (req, res, next) {
    
    try{
        const {review , article, brand} = req.body
        const newreview = await createReview(review, false)
        
        const itemWhole = await Item_whole.findOne({article, brand})
    
        itemWhole.reviews.push(newreview)
        await itemWhole.save();
    
        res.status(200).json('success')
    }
    catch(error){
        res.status(500).json('error')
    }
}

const AddCommentToReview = async function (req, res, next) {
    
    try{
        const {comment, _id} = req.body
        const creating = await createComment(comment)
        
        const review = await Review.findOne({_id})
        
        review.comments.push(creating)
        await review.save();
        
        res.status(200).json('comment added successfully');
    }
    catch(error){
        res.status(500).json('error')
    }
}

async function getDate () {
    return new Promise((resolve, reject)=> {
    const date = new Date()
    const year = date.getFullYear()
    let month = date.getMonth() + 1
        if (month < 10) {
          month = `0${month}`
        }
        let day = date.getDate()
        if (day < 10) {
          day = `0${day}`
        }
    const finalDate = `${day}.${month}.${year}`
    
    resolve(finalDate)
    })
}

async function createReview(review, main){
    
    const createdAt = await getDate()
    
    const newReview = new Review({
                    _id : new mongoose.Types.ObjectId(),
                    person: review.name,
                    message: review.message,
                    stars : review.stars,
                    date: createdAt,
                    main : main
                });
    
    await newReview.save();
    
    return newReview
    
};

async function createComment(comment){
    
    const createdAt = await getDate()
    
    const newComment = new Comment({
                    _id : new mongoose.Types.ObjectId(),
                    person: comment.name,
                    message: comment.message,
                    date: createdAt,
                });
    await newComment.save();
    
    return newComment
    
};

module.exports = { GetReviews, AddReview, AddReviewToProduct, AddCommentToReview}