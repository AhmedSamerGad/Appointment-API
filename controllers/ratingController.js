import Rating from '../models/ratingModel.js';
import errorHandler from '../middlewares/errorHandler.js';

export const createRating = errorHandler(async (req, res) => {
    const rating = await Rating.create(req.body);
    res.status(201).json(rating);
});

export const getRatings = errorHandler(async (req, res) => {
    const ratings = await Rating.find();
    if(!ratings){
        res.status(404).json({message: 'No ratings found'}
        );}
    res.json(ratings);
});

export const updateRatings = errorHandler(async (req, res) => {
    const rating = await Rating.findByIdAndUpdate(req.body)
    if(rating){
        res.json(rating);
    }else{
        res.status(404).json({message: 'Rating not found'});
    }

});

export const deleteRating = errorHandler(async (req, res) => {
    const rating = await Rating.findByIdAndDelete(req.params.id);
    if(rating){
        res.json({message: 'Rating deleted successfully'});
    }else{
        res.status(404).json({message: 'Rating not found'} );
    } } );