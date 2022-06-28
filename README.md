# Resource Service

## Description
Resource Service is a book resource handling microservice that together with another microservice (Auth Service) and the client application BookByte provides users with the opportunity to add books they wish to read and books they own, pairs the books with the books of other users, and presents swap suggestions.

## Techniques
The application is written in Express and uses Mongoose as an ODM to communicate with a MongoDB database that is used to store book resource data. The MongoDB database is set up with a local Docker container.

Resource Service implements JWT to check if users are authenticated and grant them access to protected resources. Data is sent back as JSON.

## Hosting
The application is hosted on my personal CS-Cloud machine and has the following URL:

https://cscloud7-240.lnu.se/bookbyte/api/v1/books/

## Routes

### GET /

#### Request
- Authorization: Bearer \*JWT\*

#### Response

##### Success
- Status: 200
- Body:      
`{   
  owned: [{   
    id: String,   
    googleId: String,   
    title: String,   
    subtitle: String,   
    authors: [String],   
    publisher: String,   
    publishedDate: String,   
    description: String,   
    language: String,   
    pageCount: Number,   
    imageLinks: {   
      smallThumbnail: String,   
      thumbnail: String   
    },   
    categories: [String]   
  }],   
  wanted: [{   
    id: String,   
    googleId: String,   
    title: String,   
    subtitle: String,   
    authors: [String],   
    publisher: String,   
    publishedDate: String,   
    description: String,   
    language: String,   
    pageCount: Number,   
    imageLinks: {   
      smallThumbnail: String,   
      thumbnail: String   
    },   
    categories: [String]       
  }]   
}`   

##### Error
- Status: 401; body: `{ status: 401, message: 'JWT invalid or not provided' }`
- Status: 500; body: `{ status: 500, message: 'An unexpected condition was encountered' }`

### POST /

#### Request
- Authorization: Bearer \*JWT\*
- Body:   
`{   
  type: 'owned'/'wanted',
  info: {
    googleId: String,   
    title: String,   
    subtitle: String,   
    authors: [String],   
    publisher: String,   
    publishedDate: String,   
    description: String,   
    language: String,   
    pageCount: Number,   
    imageLinks: {   
      smallThumbnail: String,   
      thumbnail: String   
    },   
    categories: [String]
  }
}`   

#### Response

##### Success
- Status: 201
- Body: `{ id: String }`

##### Error
- Status: 400; body: `{ status: 400, message: \*Validation error\* }`
- Status: 401; body: `{ status: 401, message: 'JWT invalid or not provided' }`
- Status: 409; body: `{ status: 409, message: 'Book already added as owned or wanted' }`
- Status: 500; body: `{ status: 500, message: 'An unexpected condition was encountered' }`

### GET /matches

#### Request
- Authorization: Bearer \*JWT\*

#### Response

##### Success
- Status: 200
- Body:   
`[
  {
    toGive: {
      id: String,   
      googleId: String,   
      title: String,   
      subtitle: String,   
      authors: [String],   
      publisher: String,   
      publishedDate: String,   
      description: String,   
      language: String,   
      pageCount: Number,   
      imageLinks: {   
        smallThumbnail: String,   
        thumbnail: String   
      },   
      categories: [String]    
    },
    toGet: {
      id: String,   
      googleId: String,   
      title: String,   
      subtitle: String,   
      authors: [String],   
      publisher: String,   
      publishedDate: String,   
      description: String,   
      language: String,   
      pageCount: Number,   
      imageLinks: {   
        smallThumbnail: String,   
        thumbnail: String   
      },   
      categories: [String]    
    },
    otherUser: \*ID\*
  }
]`   

##### Error
- Status: 401; body: `{ status: 401, message: 'JWT invalid or not provided' }`
- Status: 500; body: `{ status: 500, message: 'An unexpected condition was encountered' }`

### GET /:id

#### Request
- Authorization: Bearer \*JWT\*

#### Response

##### Success
- Status: 200
- Body:   
`{
  type: 'owned'/'wanted',
  info: {
    id: String,   
    googleId: String,   
    title: String,   
    subtitle: String,   
    authors: [String],   
    publisher: String,   
    publishedDate: String,   
    description: String,   
    language: String,   
    pageCount: Number,   
    imageLinks: {   
      smallThumbnail: String,   
      thumbnail: String   
    },   
    categories: [String]    
  }
}`

##### Error
- Status: 401; body: `{ status: 401, message: 'JWT invalid or not provided'}`
- Status: 404; body: `{ status: 404, message: 'The requested resource was not found'}`
- Status: 500; body: `{ status: 500, message: 'An unexpected condition was encountered'}`

### DELETE /:id

#### Request
- Authorization: Bearer \*JWT\*

#### Response

##### Success
- Status: 204

##### Errors
- Status: 401; body: `{ status: 401, message: 'JWT invalid or not provided' }`
- Status: 403; body: `{ status: 403, message: 'Permission to the requested resource was denied' }`
- Status: 404; body: `{ status: 404, message: 'The requested resource was not found' }`
- Status: 500; body: `{ status: 500, message: 'An unexpected condition was encountered' }`
