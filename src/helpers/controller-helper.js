import { Book } from '../models/book.js'

/**
 * Returs an object with all books that the user owns or wants.
 *
 * @param {string} user - The ID of the user.
 * @returns {object} An object with the books.
 */
export async function getBooks (user) {
  const ownedBooksProm = Book.find({ ownedBy: user })
  const wantedBooksProm = Book.find({ wantedBy: user })

  const [ownedBooks, wantedBooks] = await Promise.all([ownedBooksProm, wantedBooksProm])

  return { owned: ownedBooks, wanted: wantedBooks }
}

/**
 * Deletes the user's connection to a book.
 *
 * @param {Book} book - The book resource.
 * @param {string} user - The ID of the user.
 */
export async function deleteBook (book, user) {
  // Check if user owns the book, then remove user from book.
  const indexOwned = book.ownedBy.findIndex(owner => owner === user)
  if (indexOwned >= 0) {
    book.ownedBy.splice(indexOwned, 1)
  } else {
    // Check if user wants the book, then remove user from book.
    const indexWanted = book.wantedBy.findIndex(wanter => wanter === user)
    if (indexWanted >= 0) {
      book.wantedBy.splice(indexWanted, 1)
    }
  }

  // If no user connections left to book...
  if (!book.ownedBy.length && !book.wantedBy.length) {
    // ...remove book from collection.
    await book.remove()
  } else {
    // ...else save updates.
    await book.save()
  }
}
