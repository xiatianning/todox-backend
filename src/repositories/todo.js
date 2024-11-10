export default (db) => {
    const { TODO_COLLECTION } = process.env;
    const collection = db.collection(TODO_COLLECTION);

    async function insertOne(todo) {
        return await collection.insertOne(todo);
    }

    async function updateOne(todoID, updateData) {
        return await collection.updateOne({ todoID }, { $set: updateData });
    }

    async function findAllByUser(userID) {
        return await collection.find(
            { userID },
            { projection: { name: 1, todoID: 1, userID: 1, created: 1, done: 1, _id: 0 } }
        ).toArray();
    }

    return {
        insertOne,
        updateOne,
        findAllByUser
    };
};