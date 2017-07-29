let mongoose = require("mongoose");
let conn = mongoose.createConnection("mongodb://127.0.0.1/chat_room");
let MessageSchema = new mongoose.Schema({
    author:String,
    content:String,
    createAt:{type:Date,default:new Date()}
});
let Message = conn.model("Message",MessageSchema);
module.exports = Message;