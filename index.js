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
    const userLikeHistory = database.collection("UserLikeHistory");

    app.get('/artifacts', async (req, res) => {
      const result = await artifacts.find().toArray();
      res.send(result);
    });

    app.post('/addArtifact', async (req, res) => {
      const newArtifact = req.body;
      const result = await artifacts.insertOne(newArtifact);
      res.send(result);
    });



    app.patch('/artifact/:id/like', async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: 'Invalid id' });
        }

        const { userEmail, artifactName, artifactImage } = req.body || {};

        const filter = { _id: new ObjectId(id) };

        const updateRes = await artifacts.findOneAndUpdate(
          filter,
          { $inc: { likeCount: 1 } },
          { returnDocument: 'after' }
        );

        const updatedArtifact = updateRes;

        await userLikeHistory.insertOne({
          artifactId: new ObjectId(id),
          artifactName: artifactName || updatedArtifact.artifactName || '',
          artifactImage: artifactImage || updatedArtifact.artifactImage || '',
          userEmail,
          likedAt: new Date()
        });

        res.json(updatedArtifact);
      } catch (err) {
        console.error('like route error', err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get('/artifact/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const artifact = await artifacts.findOne(query);
      res.send(artifact);
    });

    app.get('/liked-artifacts', async (req, res) => {
      try {
        const { userEmail } = req.query;
        if (!userEmail) return res.status(400).json({ message: 'userEmail required' });

        const liked = await userLikeHistory
          .find({ userEmail })
          .sort({ likedAt: -1 })
          .project({ _id: 0, artifactId: 1, artifactName: 1, artifactImage: 1, likedAt: 1 })
          .toArray();

        res.json(liked);
      } catch (err) {
        console.error('liked-artifacts error', err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });


    app.get('/likes/check', async (req, res) => {
      try {
        const { artifactId, userEmail } = req.query;
        if (!artifactId || !userEmail) return res.json({ isLiked: false });

        if (!ObjectId.isValid(artifactId)) return res.status(400).json({ message: 'Invalid artifactId' });

        const found = await userLikeHistory.findOne({
          artifactId: new ObjectId(artifactId),
          userEmail: userEmail
        });

        res.json({ isLiked: !!found });
      } catch (err) {
        console.error('likes.check error', err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });



    app.get('/allArtifacts', async (req, res) => {
      const result = await artifacts.find().toArray();
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