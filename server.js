const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3002;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Public'));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const { log } = require('console');
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb://localhost:27017/Pharmacy";
const client = new MongoClient(uri);

const collectionNames = ["Pharmacy A", "Pharmacy B", "Pharmacy C", "Pharmacy D"];

let searchValue = "";

app.post("/submit", async (req, res) => {
    searchValue = req.body.inputMedicine;
    const searchResults = await searchValueInCollections();
    res.render("index2", { collectionName: searchResults });
});

app.post("/hold", async (req, res) => {
    const holdValue = "hold";
    
    try {
        await client.connect(); // Connect to the MongoDB server
        
        for (const collectionName of collectionNames) {
            const db = client.db();
            const collection = db.collection(collectionName);

            const updateResult = await collection.updateMany(
                { "Medicine Name": searchValue },
                { $set: { Hold: holdValue } }
            );

            console.log(`Documents updated successfully in ${collectionName}. Matched: ${updateResult.modifiedCount}`);
        }
        
        res.status(200).send("Documents updated successfully in all collections");
    } catch (error) {
        console.error("Error updating documents:", error);
        res.status(500).send("Error updating documents");
    } finally {
        client.close(); // Close the MongoDB client connection
    }
});

app.get("/getCollectionCount", (req, res) => {
    res.json({ collectionCount: collectionNames.length });
});

async function searchValueInCollections() {
    console.log("in search");
    const foundCollections = [];

    try {
        await client.connect(); // Connect to the MongoDB server
        console.log("Connected to MongoDB");

        const db = client.db();

        for (const collectionName of collectionNames) {
            const collection = db.collection(collectionName);

            const columns = ["Medicine Name", "Price (INR)", "Use", "Quantity", "Latitude", "Longitude"];

            for (const column of columns) {
                const query = {};
                query[column] = searchValue;

                const document = await collection.findOne(query);

                if (document) {
                    console.log(`Found in collection: ${collectionName}, column: ${column}`);
                    foundCollections.push(collectionName);
                    break;
                }
            }
        }
    } catch (err) {
        console.error("Error connecting to MongoDB", err);
    } finally {
        client.close();
    }

    return foundCollections;
}
