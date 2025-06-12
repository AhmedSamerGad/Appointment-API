import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
    {
      title: {
        type: String,
      },
      ratedUser: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // The user being rated
      }],
      ratedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // The user giving the rating
      },
      points: {
        type: Number,
        required: true,
        min: 0,
        max: 5, // Rating between 1 and 5
        default:0
      },
      comment: {
        type: String,
        maxlength: 500, // Optional comment
      },
      hasRated: {
        type: Boolean,
        default: false,
    },
    ratedAt : { type : Date },
    cumulativeRatingPoints: {
        type: Number,
        default: 0
    }
    },
    { timestamps: true }
  );


  export default ratingSchema;