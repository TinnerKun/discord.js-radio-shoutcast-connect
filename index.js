"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const axios_1 = __importDefault(require("axios"));
const g_i_s_1 = __importDefault(require("g-i-s"));
const request_1 = __importDefault(require("request"));
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 3000;
const steaming = "http://192.168.1.4:12345/";
const steaming_read = steaming.createReadStream(steaming);
let clients = [], data = [], songtitle = "", img = undefined;
const client_discord = new discord_js_1.default.Client();
steaming_read.on("connect", function () {
    console.error("Radio Stream connected!");
});
steaming_read.on("data", function (chunk) {
    if (clients.length > 0) {
        for (client in clients) {
            clients[client].write(chunk);
        }
        ;
    }
});
function fancyTimeFormat(duration) {
    var hrs = ~~(duration / 3600);
    var mins = ~~((duration % 3600) / 60);
    var secs = ~~duration % 60;
    var ret = "";
    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }
    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}
setInterval(() => {
    axios_1.default.get(`${steaming}stats?sid=1&pass=14587931zxcv&json=1`)
        .then((response) => {
        data = response.data;
        if (data["songtitle"] != songtitle) {
            (0, g_i_s_1.default)(data["songtitle"], logResults);
            function logResults(error, results) {
                if (error) {
                    console.log(error);
                }
                else {
                    if (img !== undefined) {
                        let send_s = new discord_js_1.default.MessageEmbed()
                            .setAuthor("SyChan Radio")
                            .setColor("RANDOM")
                            .setTitle(`Playing : ${data["songtitle"]}`)
                            .setTimestamp()
                            .setImage(results[0]["url"])
                            .setFooter("SycerNetwork https://radio.sycer.network");
                        client_discord.channels.fetch(" announce ").then(channel => channel.send(send_s));
                    }
                    img = results[0]["url"];
                }
            }
            console.log(`Playing : ${data["songtitle"]}`);
            songtitle = data["songtitle"];
        }
    });
}, 1000);
app.get('/status', (req, res) => {
    res.set({
        'X-Powered-By': "SycerNetwork API"
    });
    res.send(data);
});
app.get('/status/:a', (req, res) => {
    switch (req.params['a']) {
        case 'info':
            res.set({
                'X-Powered-By': "SycerNetwork API"
            });
            let json_send_status_info = {
                "songtitle": data["songtitle"],
                "songimage": img ? img : 'https://cdn.discordapp.com/attachments/889652344202088458/958664950916726834/normaloutput.png',
                "time": fancyTimeFormat(data["streamuptime"])
            };
            res.send(json_send_status_info);
            break;
        default:
            res.set({
                'X-Powered-By': "SycerNetwork API"
            });
            res.send(data);
            break;
    }
});
app.get('/image', async (req, res) => {
    (0, request_1.default)({
        url: img ? img : 'https://cdn.discordapp.com/attachments/889652344202088458/958664950916726834/normaloutput.png',
        encoding: null
    }, (err, resp, buffer) => {
        if (!err && resp.statusCode === 200) {
            res.set({
                'X-Powered-By': "SycerNetwork API",
                "Content-Type": "image/jpeg"
            });
            res.send(resp.body);
        }
    });
});
app.get('/', (req, res) => {
    res.set({
        'X-Powered-By': "SycerNetwork API"
    });
    res.send('helloworld');
    res.status(404);
});
app.get("/radio", (req, res) => {
    res.writeHead(200, {
        'X-Powered-By': "SycerNetwork API",
        "Content-Type": "audio/mpeg",
        'Transfer-Encoding': 'chunked',
        "User-Agent": `${req.get('user-agent')} | ${req.socket.remoteAddress}`
    });
    clients.push(res);
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
client_discord.on("ready", () => {
    let songtitle_setActivity = undefined;
    setInterval(() => {
        if (data["songtitle"] != songtitle_setActivity)
            client_discord.user.setActivity(`Playing ${data["songtitle"]}`, { type: 'PLAYING', status: "dnd" });
        songtitle_setActivity = data["songtitle"];
    }, 100);
    const channel = client_discord.channels.cache.get('join voice channel');
    if (!channel)
        return console.error("The channel does not exist!");
    channel.join().then(connection => {
        connection.play('http://localhost:3000/radio', { bitrate: 384000 /* 384kbps */ });
    }).catch(e => {
        console.error(e);
    });
});
client_discord.login('token discord');
