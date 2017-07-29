let express = require("express");
let app = express();
let path = require("path");
let Message = require("./model");

let sockets = {};

app.use(express.static(path.resolve("../node_modules")));
app.get("/",function (req, res) {
    // 用当前路径 + 参数路径
    res.sendFile(path.resolve("./index.html"));
});
let server = require("http").createServer(app);
// websocket 的握手要借助http协议来实现

// io 就相当于websocket 服务器
let io = require("socket.io")(server);
// 服务器端监听客户端连接
// 每当有一个客户端连接上来后 会为这个客户端分配一个socket对象 然后就可以通过这个socket对象进行通信
io.on("connection",function (socket) {
    let username,currentRoom;
    socket.on("message",function (msg) {
        if(username){
            let regex = /@([^ ]+) (.+)/;
            let result = msg.match(regex);
            if(result){
                let toUser = result[1];
                let content = result[2];
                sockets[toUser] && sockets[toUser].send({
                    author:username,
                    content:`<span class="red">对你说:</span> ${content}`,
                    createAt:new Date()
                });
                socket.send({
                    author:username,
                    content:`对<span class="author">${toUser}</span> 说: ${content}`,
                    createAt:new Date()
                });
            }else{
                Message.create({
                    author:username,
                    content:msg,
                    createAt:new Date()
                },function (err, message) {
                    io.emit("message",{author:username,content:msg,createAt:new Date()});
                });
            }

        }else{
            username = msg;
            sockets[username] = socket;
            io.emit("message",{author:"系统",content:`欢迎 ${username} 来到聊天室`,createAt:new Date()});
        }
    });
    socket.on("getAllMessages",function () {
        Message.find().sort({createAt:-1}).limit(20).exec(function (err,messages) {
            // 向客户端发送一个allMessages事件
            socket.emit("allMessages",messages);
        })
    });
    socket.on("join",function (roomName) {
        if(currentRoom){
            socket.leave(currentRoom);
        }else{
            // 让某个客户端进入某个房间
            socket.join(roomName);
            currentRoom = roomName;
        }
    })
});

server.listen(8080);