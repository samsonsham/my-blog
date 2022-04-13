import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import { MongoClient } from 'mongodb'
import path from 'path'

const app = express()

app.use(express.static(path.join(__dirname, '/dist')))
app.use(bodyParser.json())

const withDB = async (operations, res) => {
  try {
    const client = new MongoClient(process.env.DB_URL)
    await client.connect()
    const db = client.db(process.env.DB_NAME)

    await operations(db)

    client.close()
  } catch (error) {
    res.status(500).json({ message: 'Error connecting to db', error })
  }
}

app.get('/api/articles/:name', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name
    const articleInfo = await db
      .collection('articles')
      .findOne({ name: articleName })
    res.status(200).json(articleInfo)
  }, res)
})

app.post('/api/articles/:name/upvote', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name
    const articleInfo = await db
      .collection('articles')
      .findOne({ name: articleName })
    await db.collection('articles').updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articleInfo.upvotes + 1,
        },
      }
    )
    const updatedArticleInfo = await db
      .collection('articles')
      .findOne({ name: articleName })

    res.status(200).json(updatedArticleInfo)
  }, res)
})

app.post('/api/articles/:name/add-comment', (req, res) => {
  const { username, text } = req.body
  const articleName = req.params.name

  withDB(async (db) => {
    const articleInfo = await db
      .collection('articles')
      .findOne({ name: articleName })
    await db.collection('articles').updateOne(
      { name: articleName },
      {
        $push: {
          comments: { username, text },
        },
      }
    )
    const updatedArticleInfo = await db
      .collection('articles')
      .findOne({ name: articleName })

    res.status(200).send(updatedArticleInfo)
  }, res)
})

app.get('/my-blog-webpack/*', (req, res) => {
  res.send(path.join(__dirname + '/dist/index.html'))
})

app.listen(8000, () => console.log('Listening on port 8000'))
