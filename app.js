//Use CLS to clear CMD, because you keep on forgetting

const WebSocket = require('ws');
const chalk = require('chalk');

//  [[Settings]]
//Basic
var chatrooms = [""]; //Currently Selected Chatroom
var chatcolors = ["blue","red","green","cyan","yellow","magenta","gray","redBright","greenBright","yellowBright","blueBright","magentaBright","cyanBright"]

//Advanced
var showchat = false; //Displays tag for chat
var subonly = false; //Sub only mode
var viponly = false; //Vip only mode
var modonly = false; //mod only mode
var rmsubbadge = false; //Removes the Subbadge, good for subonly mode
var disablecolors = true; //Removes colors, great for multichat
var chatcounter = true; //Count the amount of chats
var reconnect = true; //If the connection is closed, restart it

//Bots
var bots = ["StreamElements","Moobot"];
var removebots = true;

function createWebSocket() {
    let socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    socket.onopen = function (e) {
        console.log("[open] Connection established");
        console.log("Sending to server");
        socket.send("PASS someranpass");
        socket.send("NICK justinfan" + Math.floor((Math.random() * 99999) + 10000));
        for (x of chatrooms) {
            socket.send("JOIN #" + x);
        }
        socket.send("CAP REQ :twitch.tv/tags")
    };

    firstmsg = true;
    chatcount = 1;
    socket.onmessage = function (event) {
        if (event.data.search("PING :tmi.twitch.tv")!=-1) {
            console.log(`[message] PING received from server: ${event.data}`);
            socket.send("PONG :tmi.twitch.tv")
        } else if (event.data.split(";").length > 10) {
            if (firstmsg) {
                var announcement = `Opened Chat: `;
                var counter = 1;
                for (x of chatrooms) {
                    if (counter < chatrooms.length) {
                        announcement = announcement + x + ", ";
                    } else {
                        announcement = announcement + x;
                    }
                    counter++;
                }
                if (subonly) {
                    announcement = announcement + `, in subonly mode`;
                }
                announcement = announcement + `. `;
                if (rmsubbadge) {
                    announcement = announcement + `(Sub Badge not visible)`;
                }
                console.log("");
                console.log(chalk.bold(announcement));
                firstmsg = false;
            }
            var message = event.data.split(";");
            var sentmsg = "";
            var badges, color, name, mod, sub, msg, currchat;

            for (x of event.data.split(";")) {
                if (x.search("badges")) {
                    badges = x;
                }
                if (x.search("color") != -1) {
                    color = x;
                }
                if (x.search("name") != -1 && x.search("reply-parent") == -1) {
                    name = x;
                }
                if (x.search("mod=") != -1) {
                    mod = x;
                }
                if (x.search("subscriber") != -1) {
                    sub = x;
                }
                if (x.search("PRIVMSG") != -1) {
                    msg = x;
                    currchat = msg.substring(msg.search("#") + 1, msg.search("#") + msg.substring(msg.search("#")).search(" "));
                }
            }

            //console.log(`C: ${color} N: ${name} M: ${mod} S: ${sub} T: ${msg}`);
            //console.log(event.data.split(";").length);
            //console.log(event.data.split(";"));

            if (chatcounter) {
                sentmsg = sentmsg + `[#${chatcount}]`;
            }
            if (showchat) {
                sentmsg = sentmsg + `[${currchat}]`;
            }
            if (mod.substring(mod.search("=") + 1) == "1") {
                sentmsg = sentmsg + "[MOD]";
            }
            if (badges.search("vip") != -1) {
                sentmsg = sentmsg + "[VIP]";
            }
            if (sub.substring(sub.search("=") + 1) == "1" && !rmsubbadge) {
                sentmsg = sentmsg + "[SUB]";
            }

            sentmsg = sentmsg + name.substring(name.search("=") + 1) + ": ";
            sentmsg = sentmsg + msg.substring(msg.search("#") + currchat.length + 3);
            if (!subonly && !viponly && !modonly || subonly && sub.search("1") != -1 || viponly && badges.search("vip") != -1 || modonly && mod.substring(mod.search("=") + 1) == "1") {
                if (color.search("#") != -1 && !disablecolors) {
                    console.log(chalk.hex(color.substring(color.search("=") + 1))(sentmsg));
                } else if (disablecolors) {
                    console.log(chalk.keyword(chatcolors[chatrooms.indexOf(currchat)])(sentmsg));
                } else {
                    console.log(chalk.hex("#" + ((1 << 24) * Math.random() | 0).toString(16))(sentmsg));
                }
                chatcount = chatcount + 1;
            }
            //clear after 5000 messages
            if (chatcount > 5000) {
                console.clear();
                chatcount = 0;
            }
        } else {
            console.log(`[message] Data received from server: ${event.data}`);
        }
    };

    socket.onclose = function (event) {
        if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            // e.g. server process killed or network down
            // event.code is usually 1006 in this case
            console.log('[close] Connection died');
        }
        console.clear();
        if (reconnect) {
            console.log("Reestablishing connection...");
            createWebSocket();
        } else {
            console.log("Program exited.")
        }
    };

    socket.onerror = function (error) {
        console.log(`[error] ${error.message}`);
    };
}

createWebSocket();