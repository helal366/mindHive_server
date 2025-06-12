require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middlewire
app.use(cors());
app.use(express.json());

// token related middlewares
// token verify
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
        return res.status(403).send('Forbidden access')
      }
      req.decoded = decoded
      next()
    })
  }
}

// email verify
const emailVerify = (req, res, next) => {
  const decodedEmail = req.decoded.email;
  const { email } = req.params;
  console.log(decodedEmail, email)
  if (decodedEmail !== email) {
    return res.status(403).send('Forbidden access!')
  }
  next()
}
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    // strict: false,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const database = client.db('mindHive');
    const articlesCollection = database.collection('articles');
    const commentsCollection = database.collection('comments');

    // jwt post api
    app.post('/jwt', (req, res) => {
      const user = { email: req.body.email };
      const token = jwt.sign(user, process.env.JWT_SECRET_KEY, {
        expiresIn: '365d'
      });
      res.send({ token, message: 'JWT created successfully!' })
    })
    // post single article data
    app.post('/post-article', tokenVerify, async (req, res) => {
      const articleData = req.body;
      const email = articleData.authorEmail;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send('Forbidden access!')
      }
      const result = await articlesCollection.insertOne(articleData);
      res.send(result);
    })

    // single comment post
    app.post('/comment', tokenVerify, async (req, res) => {
      const commentInfo = req.body;
      const result = await commentsCollection.insertOne(commentInfo);
      res.send(result)
    })

    // get all article data
    app.get('/articles', async (req, res) => {
      const { searchParams } = req.query;
      // console.log(searchParams)
      let filter = {};
      if (searchParams) {
        filter = {
          title: { $regex: searchParams, $options: 'i' }
        }
      }
      const allArticles = await articlesCollection.find(filter).toArray();
      res.send(allArticles)
    });

    // get all comments sorted by article id
    app.get('/comments/:articleID', tokenVerify, async (req, res) => {
      const { articleID } = req.params;
      // console.log(articleID);
      if (!ObjectId.isValid(articleID)) {
        return res.status(400).send('Invalid article ID format');
      }

      const filter = { articleID };
      const articleComments = await commentsCollection.find(filter).toArray()
      // console.log(articleComments)
      res.send(articleComments)
    })

    // get a single article by id
    app.get('/article/:id', tokenVerify, async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send('Invalid article ID format');
      }
      const filter = {
        _id: new ObjectId(id)
      };
      const singleArticle = await articlesCollection.findOne(filter);
      res.send(singleArticle)

    });

    // get article categories aggregate group
    app.get('/categories', async(req,res)=>{
      const categories=await articlesCollection.aggregate([{$group: {_id:"$category"}}]).toArray();
      // console.log(categories)
      res.send(categories)
    });

    app.get('/category-articles/:category', async(req,res)=>{
      const {category}=req.params;
      const filter={category};
      const categoryArticles= await articlesCollection.find(filter).toArray();
      // console.log(categoryArticles);
      res.send(categoryArticles)
    })

    // update single article and find by id
    app.put('/update-article/:id', tokenVerify, async (req, res) => {
      const { id } = req.params;
      const decodedEmail = req.decoded.email
      const filter = {
        _id: new ObjectId(id)
      };
      const article = await articlesCollection.findOne(filter);
      const userEmail = article.authorEmail;
      if (!article || userEmail !== decodedEmail) {
        return res.status(403).send('Forbidden access!')
      }
      const updatedDoc = req.body;
      const update = {
        $set: {
          ...updatedDoc
        }
      };
      const result = await articlesCollection.updateOne(filter, update);
      res.send(result);
    });
    //delete article filtering by id
    app.delete('/delete-article/:id', tokenVerify, async (req, res) => {
      const { id } = req.params;
      const decodedEmail = req.decoded.email
      const filter = {
        _id: new ObjectId(id)
      }
      const article = await articlesCollection.findOne(filter);
      const userEmail = article.authorEmail;
      if (!article || userEmail !== decodedEmail) {
        return res.status(403).send('Forbidden access!')
      }
      const result = await articlesCollection.deleteOne(filter);
      res.send(result)
    })

    // get author wise articles
    app.get('/my-articles/:email', tokenVerify, emailVerify, async (req, res) => {
      const { email } = req.params;
      const filter = {
        authorEmail: email
      };
      const allMyArticles = await articlesCollection.find(filter).toArray();
      res.send(allMyArticles);
    })

    // app patch to upsert likes in article collections
    app.patch('/article-like/:id', tokenVerify, async (req, res) => {
      const { id } = req.params;
      const likes = req.body.likes;
      const likedUsers = req.body.likedUsers
      const query = {
        _id: new ObjectId(id)
      };
      const updatedDoc = {
        $set: {
          likes, likedUsers
        }
      };
      const options = { upsert: true };
      const result = await articlesCollection.updateOne(query, updatedDoc, options);
      res.send(result)
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
  res.send(`Welcome to mind hive!`)
});
app.listen(port, () => {
  console.log(`The server is running on the port, ${port}`)
})



