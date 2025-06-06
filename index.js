const express = require('express');
require('dotenv').config();
const cors = require('cors');
const app=express();
const port=process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');


// middlewire
app.use(cors());
app.use(express.json());




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
   
      const database=client.db('mindHive');
      const articlesCollection=database.collection('articles');
    // post single article data
      app.post('/post-article', async(req,res)=>{
        const articleData=req.body;
        const result = await articlesCollection.insertOne(articleData);
        res.send(result);
      })

      // get all article data
      app.get('/articles',async(req,res)=>{
        const allArticles=await articlesCollection.find().toArray();
        res.send(allArticles)
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






app.get('/', (req,res)=>{
    res.send(`Welcome to mind hive!`)
});
app.listen(port, ()=>{
    console.log(`The server is running on the port, ${port}`)
})



