/**
 * Book routes.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import createError from 'http-errors'
import express from 'express'
import jwt from 'jsonwebtoken'
import { BookController } from '../../../controllers/api/book-controller.js'

export const router = express.Router()

const controller = new BookController()

/**
 * Authenticates requests.
 *
 * If authentication is successful, `req.user`is populated and the
 * request is authorized to continue.
 * If authentication fails, an unauthorized response will be sent.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const authenticateJWT = (req, res, next) => {
  try {
    const [authenticationScheme, token] = req.headers.authorization?.split(' ')

    if (authenticationScheme !== 'Bearer') {
      throw new Error('Invalid authentication scheme.')
    }

    const publicKey = Buffer.from(process.env.PUBLIC_KEY, 'base64')

    const payload = jwt.verify(token, publicKey)

    req.user = payload.sub

    next()
  } catch (err) {
    const error = createError(401, 'Access token invalid or not provided.')
    error.cause = err
    next(error)
  }
}

/**
 * Authorize requests.
 *
 * If authorization is successful, that is the user is granted access
 * to the requested resource, the request is authorized to continue.
 * If authentication fails, a forbidden response will be sent.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const hasPermission = (req, res, next) => {
  let same = false
  req.book.ownedBy.forEach(user => {
    if (user === req.user) {
      same = true
    }
  })

  req.book.wantedBy.forEach(user => {
    if (user === req.user) {
      same = true
    }
  })

  if (same) {
    next()
  } else {
    next(createError(403, 'Permission to the requested resource was denied.'))
  }
}

// Provide req.book to the route if :id is present in the route path.
router.param('id', (req, res, next, id) => controller.loadBook(req, res, next, id))

// --- Routes ---
router.get('/',
  authenticateJWT,
  (req, res, next) => controller.findAll(req, res, next)
)

router.post('/',
  authenticateJWT,
  (req, res, next) => controller.create(req, res, next)
)

router.get('/matches',
  authenticateJWT,
  (req, res, next) => controller.findMatches(req, res, next)
)

router.get('/:id',
  authenticateJWT,
  (req, res, next) => controller.find(req, res, next)
)

router.delete('/:id',
  authenticateJWT,
  hasPermission,
  (req, res, next) => controller.delete(req, res, next)
)
