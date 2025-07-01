import mongoose from "mongoose";

const ratingUserSchema = new mongoose.Schema({
  ratedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  comment: {
      type: String,
      maxlength: 500
    },
  cumulativeRatingPoints: {
    type: Number,
    default: 0
  },
  reviews: [
    {
      title: {
        type: String,
        required: true
      },
      points: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0
      }
    }
  ]
}, { _id: false });

const ratingSchema = new mongoose.Schema(
  {
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
   
    
    hasRated: {
      type: Boolean,
      default: false
    },
    ratedAt: { type: Date },
    users: [ratingUserSchema]
  },
  { timestamps: true }
);
export default ratingSchema;