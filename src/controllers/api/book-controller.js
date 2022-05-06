/**
 * Module for the BookController.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import createError from 'http-errors'
import * as helper from '../../helpers/controller-helper.js'
import { Book } from '../../models/book.js'

/**
 * Encapsulates a controller.
 */
export class BookController {
  /**
   * Loads a specific book to the request object.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @param {string} id - The id of the book to load.
   */
  async loadBook (req, res, next, id) {
    try {
      req.book = await Book.findById(id)
      next()
    } catch (error) {
      next(createError(404, 'The requested resource was not found'))
    }
  }

  /**
   * Sends a JSON response containing all of the user's books (owned/wanted).
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async findAll (req, res, next) {
    try {
      const books = await helper.getBooks(req.user)
      res.json(books)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sends a JSON response containing all book matches for the user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async findMatches (req, res, next) {
    try {
      const wantedBooks = await Book.find({ wantedBy: req.user })

      const matches = []

      for (let i = 0; i < wantedBooks.length; i++) {
        const wantedBook = wantedBooks[i]
        for (let j = 0; j < wantedBook.ownedBy.length; j++) {
          const owner = wantedBook.ownedBy[j]
          const wantedBooksOwner = await Book.find({ wantedBy: owner })
          for (let k = 0; k < wantedBooksOwner.length; k++) {
            const wantedBookOwner = wantedBooksOwner[k]
            if (wantedBookOwner.ownedBy.includes(req.user)) {
              matches.push({
                toGive: wantedBookOwner,
                toGet: wantedBook,
                otherUser: owner
              })
            }
          }
        }
      }

      res.json(matches)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Creates a book if book not already stored in database, and adds user to the book.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async create (req, res, next) {
    try {
      const info = req.body.info
      const type = req.body.type

      // Validate input.
      if (!info?.googleId || !type || (type !== 'owned' && type !== 'wanted')) {
        return next(createError(400, 'The requested data was not provided'))
      }

      const book = await Book.findOne({ googleId: info.googleId })
      // If book already exists in database...
      if (book) {
        if (book.ownedBy?.includes(req.user) || book.wantedBy?.includes(req.user)) {
          // Do not add user to book if already added.
          return next(createError(409, 'Book already added as owned or wanted'))
        }

        if (type === 'owned') {
          book.ownedBy.push(req.user)
        } else if (type === 'wanted') {
          book.wantedBy.push(req.user)
        }

        await book.save()
      } else {
        // (If book not already exists in database...)

        const data = {
          ...info,
          ownedBy: [],
          wantedBy: []
        }

        if (type === 'owned') {
          data.ownedBy.push(req.user)
        } else if (type === 'wanted') {
          data.wantedBy.push(req.user)
        }

        // ...create book and add user to it.
        const newBook = new Book(data)
        await newBook.save()
      }
      // Prepare and send book data in response.
      const sameBook = await Book.findOne({ googleId: info.googleId })

      res.status(201).json({ id: sameBook.id })
    } catch (error) {
      let err = error

      if (error.name === 'ValidationError') {
        // Validation error(s).
        err = createError(400, error.message)
        err.cause = error
      }

      next(err)
    }
  }

  /**
   * Sends data for a specific book to the client.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  find (req, res, next) {
    let type = 'none'

    if (req.book.ownedBy?.includes(req.user)) {
      type = 'owned'
    }

    if (req.book.wantedBy?.includes(req.user)) {
      type = 'wanted'
    }

    res.json({ info: req.book, type })
  }

  /**
   * Removes user from book, and removes book if no connected users are left.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async deleteOne (req, res, next) {
    try {
      await helper.deleteBook(req.book, req.user)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }

  /**
   * Removes user from all books, and removes books if no connected users are left.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async deleteAll (req, res, next) {
    try {
      // Get all books the user has connections to.
      const { owned, wanted } = await helper.getBooks(req.user)
      const books = [...owned, ...wanted]

      const promises = []
      for (let i = 0; i < books.length; i++) {
        const book = books[i]
        promises.push(helper.deleteBook(book, req.user))
      }

      await Promise.all(promises)

      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
}
