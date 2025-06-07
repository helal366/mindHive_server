const express = require('express');
require('dotenv').config();
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middlewire
app.use(cors());
app.use(express.json());

// token related middlewares
const tokenVerify = (req, res, next) => {
  const authHeader = req?.headers?.authorization;
  if (!authHeader) {
    return res.status(401).send('Unauthorized access')
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).send('Unauthorized access')
  }
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (err) {
        res.status(403).send('Forbidden access')
      }
      req.decoded=decoded
    })
  }
  next()
}


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const database = client.db('mindHive');
    const articlesCollection = database.collection('articles');

    // jwt post api
    app.post('/jwt', (req, res) => {
      const user = { email: req.body.email };
      const token = jwt.sign(user, process.env.JWT_SECRET_KEY, {
        expiresIn: '365d'
      });
      res.send({ token, message: 'JWT created successfully!' })
    })
    // post single article data
    app.post('/post-article', async (req, res) => {
      const articleData = req.body;
      const result = await articlesCollection.insertOne(articleData);
      res.send(result);
    })

    // get all article data
    app.get('/articles', async (req, res) => {
      const { searchParams } = req.query;
      console.log(searchParams)
      let filter = {};
      if (searchParams) {
        filter = {
          title: { $regex: searchParams, $options: 'i' }
        }
      }
      const allArticles = await articlesCollection.find(filter).toArray();
      res.send(allArticles)
    });

    // get a single article by id
    app.get('/article/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: new ObjectId(id)
      };
      const result = await articlesCollection.findOne(filter);
      res.send(result)

    });

    // get author wise articles
    app.get('/my-articles/:email', tokenVerify, async (req, res) => {

      const { email } = req.params;
      const filter = {
        authorEmail: email
      };
      const allMyArticles = await articlesCollection.find(filter).toArray();
      res.send(allMyArticles);
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
  res.send(`Welcome to mind hive!`)
});
app.listen(port, () => {
  console.log(`The server is running on the port, ${port}`)
})



