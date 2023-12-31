/**
 * Mongoose Book model.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import mongoose from 'mongoose'

// Create a schema.
const schema = new mongoose.Schema({
  googleId: {
    type: String,
    required: [true, 'Google ID is required.'],
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Title is required.']
  },
  subtitle: {
    type: String
  },
  authors: {
    type: [String],
    required: [true, 'Authors are required.']
  },
  publisher: {
    type: String
  },
  publishedDate: {
    type: String
  },
  description: {
    type: String
  },
  pageCount: {
    type: Number
  },
  categories: {
    type: [String]
  },
  imageLinks: {
    smallThumbnail: {
      type: String
    },
    thumbnail: {
      type: String
    }
  },
  language: {
    type: String
  },
  ownedBy: {
    type: [String]
  },
  wantedBy: {
    type: [String]
  }
},
{
  timestamps: true,
  toJSON: {
    /**
     * Performs a transformation of the resulting object to remove sensitive information.
     *
     * @param {object} doc - The mongoose document which is being converted.
     * @param {object} ret - The plain object representation which has been converted.
     */
    transform: function (doc, ret) {
      delete ret._id
      delete ret.__v
      delete ret.createdAt
      delete ret.updatedAt
      delete ret.ownedBy
      delete ret.wantedBy
    },
    virtuals: true // ensure virtual fields are serialized
  }
})

schema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Create a model using the schema.
export const Book = mongoose.model('Book', schema)
