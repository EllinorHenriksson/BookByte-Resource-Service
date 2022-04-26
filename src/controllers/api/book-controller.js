/**
 * Module for the BookController.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import createError from 'http-errors'
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
      next(createError(404, 'The requested resource was not found.'))
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
      const ownedBooksProm = Book.find({ ownedBy: req.user })
      const wantedBooksProm = Book.find({ wantedBy: req.user })

      const [ownedBooks, wantedBooks] = await Promise.all([ownedBooksProm, wantedBooksProm])

      res.json({ owned: ownedBooks, wanted: wantedBooks })
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
      // OBS! Gör om allt i denna metod (tillhör findAll)
      // OBS! Denna rad funkar!
      const books = await Book.find({ wantedBy: req.user })

      /*
      // Get the books that the user owns.
      const ownedBooks = books.filter(book => book.ownedBy.includes(req.user))

      // Get the books that the user wants to have.
      const wantedBooks = books.filter(book => book.wantedBy.includes(req.user))

      res.json({ owned: ownedBooks, wanted: wantedBooks })
      */
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
      // Validate input.
      if (!req.body.googleId || !req.body.type || (req.body.type !== 'owned' && req.body.type !== 'wanted')) {
        res.status(400, 'The requested data was not provided.').end()
      }

      const book = await Book.findOne({ googleId: req.body.googleId })
      // If book already exists in database...
      if (book) {
        if (book.ownedBy?.includes(req.user) || book.wantedBy?.includes(req.user)) {
          // Do not add user to book if already added.
          return next(createError(409, 'Book already added as owned or wanted.'))
        }

        if (req.body.type === 'owned') {
          book.ownedBy.push(req.user)
        } else if (req.body.type === 'wanted') {
          book.wantedBy.push(req.user)
        }

        await book.save()
      } else {
        // (If book not already exists in database...)
        const data = {
          googleId: req.body.googleId,
          ownedBy: [],
          wantedBy: []
        }

        if (req.body.type === 'owned') {
          data.ownedBy.push(req.user)
        } else if (req.body.type === 'wanted') {
          data.wantedBy.push(req.user)
        }

        // ...create book and add user to it.
        const newBook = new Book(data)
        await newBook.save()
      }
      // Prepare and send book data in response.
      const sameBook = await Book.findOne({ googleId: req.body.googleId })
      res.status(201, 'Book was succesfully added.').json(sameBook)
    } catch (error) {
      let err = error

      if (err.code === 11000) {
        // Duplicated keys.
        err = createError(409, 'The  and/or email address already registered.')
        err.cause = error
      } else if (error.name === 'ValidationError') {
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
    res.json(req.book)
  }

  /**
   * Removes user from book, and removes book if no connected users are left.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async delete (req, res, next) {
    try {
      // Check if user owns the book, then remove user from book.
      const indexOwned = req.book.ownedBy.findIndex(user => user === req.user)
      if (indexOwned >= 0) {
        req.book.ownedBy.splice(indexOwned, 1)
      } else {
        // Check if user wants the book, then remove user from book.
        const indexWanted = req.book.wantedBy.findIndex(user => user === req.user)
        if (indexWanted >= 0) {
          req.book.wantedBy.splice(indexWanted, 1)
        }
      }

      // If no user connections left to book...
      if (!req.book.ownedBy.length && !req.book.wantedBy.length) {
        // ...remove book from collection.
        await req.book.remove()
      } else {
        // ...else save updates.
        await req.book.save()
      }

      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
}
