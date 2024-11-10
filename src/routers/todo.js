import express from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { v4 as uuidv4 } from 'uuid';
import { validateTodo, validateUser } from '../schemas/validators.js';
import auth from '../middleware/auth.js';
import { verifyToken } from '../functions/cookies.js';


dayjs.extend(utc);
const router = express.Router();

export default ({todoRepository}) => {
    // Create new todo
    router.post('/', auth, async (req, res) => {
        try {
            let session = verifyToken(req.cookies['todox-session']);

            const todoID = uuidv4();
            const created = dayjs().utc().toISOString();

            let newTodo = {
                ...req.body,
                todoID,
                userID: session.userID,
                created,
                done: false
            };

            if (validateTodo(newTodo)) {
                let resultTodo = await todoRepository.insertOne(newTodo);
                return res.status(201).send(resultTodo);
            }
            console.error(validateTodo.errors);
            return res.status(400).send({error: "Invalid field used."});
        }
        catch (err) {
            console.error(err);
            return res.status(500).send({error: "Todo creation failed."});
        }
    });

    // Update a specific todo by todoID
    router.patch('/:todoID', auth, async (req, res) => {
        try {
            const { todoID } = req.params;

            // Only allow updates to 'done' or 'name' fields for security
            const allowedFields = ['done', 'name'];
            const updates = Object.keys(req.body);

            if (!updates.every(field => allowedFields.includes(field))) {
                return res.status(400).send({ error: "Only 'done' or 'name' fields can be updated." });
            }

            // Prepare the update object
            const updateData = {};
            if (req.body.done !== undefined) updateData.done = req.body.done;
            if (req.body.name !== undefined) updateData.name = req.body.name;

            // Update the todo in the repository
            const updatedTodo = await todoRepository.updateOne(todoID, updateData);

            if (!updatedTodo) {
                return res.status(404).send({ error: "Todo not found." });
            }

            return res.status(200).send(updatedTodo);
        } catch (err) {
            console.error(err);
            return res.status(500).send({ error: "Todo update failed." });
        }
    });

    // Fetch todos for the logged-in user
    router.get('/', auth, async (req, res) => {
        try {
            // Verify the session and get the userID
            const session = verifyToken(req.cookies['todox-session']);
            const userID = session.userID;

            // Fetch todos for the specific userID from the repository
            const userTodos = await todoRepository.findAllByUser(userID);

            return res.status(200).send(userTodos);
        } catch (err) {
            console.error(err);
            return res.status(500).send({ error: "Todo fetch failed." });
        }
    });

    return router;
}
