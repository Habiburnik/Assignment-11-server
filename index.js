const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5001;


app.use(cors(
  {
    origin: '*',
    withcredentials: true,
  }
));

app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wx3f0no.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect();

    const database = client.db("AncientQuest");
    const artifacts = database.collection("Artifacts");

    app.get('/artifacts', async (req, res) => {
      const result = await artifacts.find().toArray();
      res.send(result);
    });

    app.post('/addArtifact', async (req, res) => {
      const newArtifact = req.body;
      const result = await artifacts.insertOne(newArtifact);
      res.send(result);
    });

    app.get('/artifact/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const artifact = await artifacts.findOne(query);
      res.send(artifact);
    });

    app.patch('/artifact/:id/like', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { 
        $inc: { likeCount: 1 },
      };
      const result = await artifacts.updateOne(filter, updateDoc);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Artifacts Management server is running')
})

app.listen(port, () => {
  console.log(`server is running on port : ${port}`)
})