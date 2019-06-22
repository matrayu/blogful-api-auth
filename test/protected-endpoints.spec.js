const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Protected Endpoints', function() {
    let db
  
    const {
      testUsers,
      testArticles,
      testComments,
    } = helpers.makeArticlesFixtures()
  
    before('make knex instance', () => {
      db = knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL,
      })
      app.set('db', db)
    })
  
    after('disconnect from db', () => db.destroy())
  
    before('cleanup', () => helpers.cleanTables(db))
  
    afterEach('cleanup', () => helpers.cleanTables(db))
  
    beforeEach(`insert articles`, () =>
      helpers.seedArticlesTables(
        db, 
        testUsers,
        testArticles,
        testComments,
      )
    )

    const protectedEndpoints = [
      {
        name: `GET /api/articles/:article_id`,
        path: `/api/articles/1`
      },
      {
        name: `GET /api/articles/:article_id/comments`,
        path: `/api/articles/1/comments`
      }
    ]

    protectedEndpoints.forEach(endpoint => {
      describe(endpoint.name, () => {
        it(`responds with a 401 'Missing bearer token' when no bearer token`, () => {
          return supertest(app)
            .get(endpoint.path)
            .expect(401, { error: `Missing bearer token` })
        })

        it(`responds 401 'Unauthorized request' when when invalid JWT secret`, () => {
          const validUser = testUsers[0]
          const invalidSecret = 'bad-secret'
          return supertest(app)
            .get(endpoint.path)
            .set('Authorization', helpers.makeAuthHeader(validUser, invalidSecret))
            .expect(401, { error: `Unauthorized request` })
        })
  
        it(`responds 401 'Unauthorized request' when invalid user`, () => {
          const userInvalid = { user_name: 'user-not-existy', id: 1 }
          return supertest(app)
            .get(endpoint.path)
            .set('Authorization', helpers.makeAuthHeader(userInvalid))
            .expect(401, { error: `Unauthorized request` })
        })
      })
    })
  })