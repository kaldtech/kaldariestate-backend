/**
 * @author Mukund Khunt
 * @description Server and REST API config
 */
import * as bodyParser from 'body-parser';
import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors'
import * as packageInfo from '../package.json'
import { messageModel, mongooseConnection, roomModel } from './database'
import { router } from './routes'
import { logger } from './helpers/winston_logger';
const app = express();
const ObjectId = require('mongoose').Types.ObjectId
console.log(process.env.NODE_ENV || 'localhost');
app.use(mongooseConnection)
app.use(cors())
app.use(bodyParser.json({ limit: "50mb" }))
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }))

const health = (req, res) => {
    return res.status(200).json({
        message: "Kaldari backend server is Up",
        app: packageInfo.name,
        version: packageInfo.version,
        author: packageInfo.author,
        license: packageInfo.license,
        contributors: packageInfo.contributors
    })
}
const bad_gateway = (req, res) => { return res.status(502).json({ status: 502, message: "Kaldari Backend API Bad Gateway" }) }
app.get('/', health);
app.get('/health', health);
app.get('/isServerUp', (req, res) => {
    res.send('Server is running ');
});
app.use(router)
app.use('*', bad_gateway);
let server = new http.Server(app);
let io = require('socket.io')(server, {
    cors: {
        origin: "*"
    },
})
io.on('connection', (socket) => {
    console.log(`New user arrived!`, socket.id);

    socket.on('join_room', async (data) => {
        // console.log('join_room', data);
        socket.room = data.roomId;
        socket.userId = data.userId;
        socket.join(data.roomId);

        socket.on('send_message', async (data) => {
            // console.log('send_message', data);
            let { roomId, senderId, receiverId, message } = data
            await roomModel.updateOne({ _id: ObjectId(data?.roomId), isActive: true }, { isActive: true })
            let messageData: any = await new messageModel({ receiverId: ObjectId(receiverId), senderId: ObjectId(senderId), message, roomId: ObjectId(roomId) }).save()
            data = { senderId, receiverId, message, _id: messageData?._id, createdAt: messageData?.createdAt }
            io.to(socket?.id).emit('receive_message', data);
            socket.to(`${roomId}`).emit('receive_message', data)
        });
    });

    socket.on('left_room', function (data) {
        console.log('left_room');
        socket.leave(socket.room);
    });

})

export default server;
