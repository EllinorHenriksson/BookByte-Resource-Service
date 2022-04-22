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

      if (!req.book) {
        return next(createError(404, 'The requested resource was not found.'))
      }

      next()
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sends a JSON response containing all books.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async findAll (req, res, next) {
    try {
      const books = await Book.find()

      res.json(books)
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
      const book = await Book.find({ googleId: req.body.googleId })
      // If book already exists in database...
      if (book) {
        if (req.body.status === 'owned') {
          if (!book.ownedBy.includes(req.user)) {
            book.ownedBy.push(req.user)
          } else {
            // Do not add user to book if already added.
            return next(createError(409, 'Book already added.'))
          }
        } else if (req.body.status === 'wanted') {
          if (!book.wantedBy.includes(req.user)) {
            book.wantedBy.push(req.user)
          } else {
            // Do not add user to book if already added.
            return next(createError(409, 'Book already added.'))
          }
        }
        await book.save()
      } else {
        // (If book not already exists in database...)
        const data = {
          googleId: req.body.googleId,
          ownedBy: [],
          wantedBy: []
        }

        if (req.body.status === 'owned') {
          data.ownedBy.push(req.user)
        } else if (req.body.statsu === 'wanted') {
          data.wantedBy.push(req.user)
        }

        // ...create book and add user to it.
        const newBook = new Book(data)
        await newBook.save()
      }
      // Prepare and send book data in response.
      const sameBook = await Book.find({ googleId: req.body.googleId })
      res.status(201, 'Book was succesfully added.').json(sameBook)
    } catch (error) {
      next(error)
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

  // OBS! Hur göra med detta? Routes?
  /**
   * Sends a JSON response containing all books.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async findAllOfUser (req, res, next) {
    try {
      const books = await Book.find()

      // Get the books that the user owns.
      const ownedBooks = books.filter(book => book.ownedBy.includes(req.user))

      // Get the books that the user wants to have.
      const wantedBooks = books.filter(book => book.wantedBy.includes(req.user))

      res.json({ owns: ownedBooks, wants: wantedBooks })
    } catch (error) {
      next(error)
    }
  }
}

// OBS! Vad ska skickas med till klienten? Räcker det med googleID eller bör anrop göras från resource service till Google Books API och data sedan skickas tillbaka som json?
