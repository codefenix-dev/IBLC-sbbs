/*

InterBBS Last Callers (IBLC)   ▄ ▄ ▄
for Synchronet                 █████
Version 0.260611               ▐▄█▄▌ cf
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
by Craig Hendricks
codefenix@conchaos.synchro.net

ConstructiveChaos BBS:
  https://conchaos.synchro.net
 telnet://conchaos.synchro.net
    ssh://conchaos.synchro.net

*/

load("sbbsdefs.js");
load("funclib.js"); 
require("dd_lightbar_menu.js", "DDLightbarMenu");

const VERSION = "0.260611";
const SETTINGS_FILE = "iblc.ini";
const USER_JSON = "iblc_users.json";
const BBS_JSON = "iblc_bbs.json";
const LAST_READ = "iblc.lr";
const MSG_SUBJ = "ibbslastcall-data";
const MSG_FROM = "ibbslastcall";
const MSG_TO = "All";
const WIDTH = console.screen_columns;
const SCREEN_RESET = "\x01q\x01l\x01n\x010\x1b[0;0 D"; // Clears screen, resets screen pause, resets colors, and resets font (if changed while calling another BBS).
const CAP = ascii(254); // Character used at the ends of the lines drawn.
const LINE = ascii(196); // Character used to draw the horizontal divider line.
const OPT_SEP = ascii(236); // Character used for separating the options on the menu.
const UP = ascii(24); // Character used to signify UP arrow.
const DOWN = ascii(25); // Character used to signity DOWN arrow.
const THIS_BBS_MARKER = ascii(175); // Character used to mark this BBS on the list of BBSes.
const DIVIDER = "\x01b\x01h" + CAP + "\x01n\x01b" + (new Array(WIDTH - 2).join(LINE)) + "\x01b\x01h" + CAP;
var lastread, messageBase, telnetPort;

function rot47(s) { // Based on rot47 def in xqtr's Python mod for Mystic.
    var res = "";
    var j;
    for (var i = 0; i < s.length; i++) {
        j = (s[i]).charCodeAt();
        if (j >= 33 && j <= 126) {
            res += ascii(33 + ((j + 14) % 94));
        } else {
            res += s.charAt(i);
        }
    }
    return res;
}

function loadJson(jsonFile) {
    var jsonData;
    if (file_exists(jsonFile)) {
        var jf = new File(jsonFile);
        if (jf.open("r", true)) {
            jsonData = JSON.parse(jf.read());
            jf.close();
        } else {
            jsonData = [];
        }
    } else {
        jsonData = [];
    }
    return jsonData;
}

function saveJson(jsonFile, jsonData, mostRecentX) {
    var jf = new File(jsonFile);
    if (jf.open("w", true)) {
        if (mostRecentX && !isNaN(mostRecentX)) {
            jf.printf(JSON.stringify(jsonData.slice(-1 * mostRecentX), undefined, 2));
        } else {
            jf.printf(JSON.stringify(jsonData, undefined, 2));
        }
        jf.close();
    }
}

function updateDataFiles() {
    var userData = loadJson(js.exec_dir + USER_JSON);
    var bbsData = loadJson(js.exec_dir + BBS_JSON);
    var msgBase = new MsgBase(messageBase);
    msgBase.open();
    var start = lastread === 0 ? msgBase.first_msg : (lastread + 1);
    var hdr, body, lines, user, bbs, date, time, city, os, address;

    for (var m = start; m <= msgBase.last_msg; m++) {
        hdr = msgBase.get_msg_header(m);
        if (hdr === null) {
            continue;
        }
        if (hdr.from === MSG_FROM && hdr.to === MSG_TO && hdr.subject !== system.name) {
            body = msgBase.get_msg_body(m);
            lines = body.split( /\r\n|\n|\r/ ); // initially used /\r?\n/ 
            for (var i = 0; i < lines.length; i++) {
				
				if ((new Date(hdr.date)).getTime() > (new Date().getTime())) {
					log(LOG_WARNING, "Filtering future date: " + hdr.date);
					continue;
				}
				
                if (lines[i] === ">>> BEGIN") {
                    user    = rot47(lines[i + 1]);
                    bbs     = rot47(lines[i + 2]);
                    date    = rot47(lines[i + 3]);
                    time    = rot47(lines[i + 4]);
                    city    = rot47(lines[i + 5]);
                    os      = rot47(lines[i + 6]);
                    address = rot47(lines[i + 7]);
                    userData.push({
                        "id": m,
                        "user": user,
                        "bbs": bbs,
                        "date": date,
                        "time": time,
                        "city": city,
                        "os": os,
                        "address": address,
                        "hdr_date": hdr.date
                    });
                    var bbsMatch = false;
                    for (var ii = 0; ii < Object.keys(bbsData).length; ii++) {
                        if (bbsData[ii].bbs === bbs) {
                            bbsData[ii].calls += 1;
                            bbsData[ii].lastcall = date + " " + time;
                            bbsData[ii].lastcall_hdr_date = hdr.date;
                            bbsData[ii].os = os;
                            bbsMatch = true;
                            break;
                        }
                    }
                    if (!bbsMatch) {
                        bbsData.push({
                            "bbs": bbs,
                            "address": address,
                            "lastcall": date + " " + time,
                            "lastcall_hdr_date": hdr.date,
                            "os": os,
                            "calls": 1
                        });
                    }
                    break;
                }
            }
        }
        lastread = m;
    }
    msgBase.close();
    
    var lrf = new File(js.exec_dir + LAST_READ);
    if (!lrf.open("w")) {
        throw "Failed to open " + LAST_READ + ".";
    }
    lrf.write(lastread); // previously used lrf.writeBin(); seemed problematic
    lrf.close();
    
	userData = userData.filter(function (item) { return (new Date(item.hdr_date)).getTime() <= (new Date()).getTime(); })
	userData.sort(function (a, b) {
        return (new Date(a.hdr_date)).getTime() > (new Date(b.hdr_date)).getTime();
    });

    saveJson(js.exec_dir + USER_JSON, userData, 100);
    saveJson(js.exec_dir + BBS_JSON, bbsData);
}

function showAbout() {
    printf(SCREEN_RESET);
    console.center("\x01n\x01hA\x01nbout \x01n\x01hI\x01nnter\x01k\x01h-\x01n\x01hB\x01nBS \x01n\x01hL\x01nast \x01n\x01hC\x01nallers (v"+VERSION+")");
    print(DIVIDER);
    print(word_wrap("\x01nThis mod interfaces with the Inter-BBS Last Caller data that gets passed " +
                    "through \x01w\x01hfsxNet\x01n. It lists the most recent last " +
                    "callers on participating BBSes, giving the option to list the BBSes and call them directly. " +
                    "Press \x01w\x01hB\x01n to browse the list of BBSes and press \x01w\x01hEnter\x01n to instantly " +
                    "telnet to any you choose.\r\n\r\n" +
                    "It was inspired by the Python mod by \x01hxqtr\x01n for Mystic BBS, but does a few things differently.\r\n\r\n" +
                    "All call times in this version are converted to the date format and local time zone of this BBS's location.\r\n\r\n" +
                    "Try it out in \x01h132-column \x01nmode sometime!\r\n\r\n" +
                    "\x01w\x01hcodefenix",
                    WIDTH - 1, WIDTH - 1, true, true));
    print(DIVIDER);
    console.pause();
}

function centerText(str) {
    try {
        return new Array(Math.ceil((WIDTH - console.strlen(str)) / 2)).join(" ") + str;
    } catch (e) {
        log(LOG_WARNING, "Unable to center text: \"" + (str ? str : "") + "\"");
        log(LOG_WARNING, "Column width: " + WIDTH);
        return "";
    }
}

function showBBSes(bbsData) {
    const ROWS = console.screen_rows - 5;
    var funcExit = false;
    var selection = 0;
    var sortMode = 0;
    var sortCols = ["bbs", "calls", "lastcall_hdr_date"];
    var sortColNames = ["BBS A-Z", "CALLS", "LAST CALL"];

    while (bbs.online && !js.terminated && !funcExit) {
        printf(SCREEN_RESET);
        console.center("\x01n\x01hI\x01nnter\x01k\x01h-\x01n\x01hB\x01nBS \x01n\x01hB\x01nBSes");
        print(DIVIDER);
        console.center("\x01nUse \x01w\x01h" + UP + " \x01nand \x01w\x01h" + DOWN  + " \x01nkeys to scroll, \x01w\x01hENTER \x01nselects");
        console.gotoxy(1, console.screen_rows - 1);
        console.center("\x01w\x01hS\x01k\x01h> \x01w\x01hSort by " + sortColNames[(sortMode + 1) > (sortCols.length - 1) ? 0 : sortMode + 1] + "  \x01k\x01h" + OPT_SEP + "  \x01w\x01hQ\x01k\x01h> \x01w\x01hQ\x01nuit");

        if (sortMode === 0) {
            bbsData.sort(function (a, b) {
                return a[sortCols[sortMode]].toUpperCase() > b[sortCols[sortMode]].toUpperCase();
            });
        } else if (sortMode === 1) {
            bbsData.sort(function (a, b) {
                return a[sortCols[sortMode]] < b[sortCols[sortMode]];
            });
        } else if (sortMode === 2) {
            bbsData.sort(function (a, b) {
                return (new Date(a[sortCols[sortMode]])).getTime() < (new Date(b[sortCols[sortMode]])).getTime();
            });
        }

        var lbMenu = new DDLightbarMenu(1, 4, WIDTH, ROWS);
        for (var i = 0; i < Object.keys(bbsData).length; i++) {
            lbMenu.Add(WIDTH < 132 ? format("%-1.1s%-24.24s %-30.30s %-5.5s %-16.16s",
                                            (bbsData[i].bbs === system.name ? THIS_BBS_MARKER : " "),
                                             bbsData[i].bbs, bbsData[i].address, bbsData[i].calls,
                                             system.datestr((new Date(bbsData[i].lastcall_hdr_date)).getTime() / 1000) + " " + to24HourTimeStr(new Date(bbsData[i].lastcall_hdr_date))) :
                     /*WIDTH===132*/ format("%-1.1s%-45.45s %-43.43s %-12.12s %-9.9s %-15.15s",
                                            (bbsData[i].bbs === system.name ? THIS_BBS_MARKER : " "),
                                             bbsData[i].bbs, bbsData[i].address, bbsData[i].os, bbsData[i].calls,
                                             system.datestr((new Date(bbsData[i].lastcall_hdr_date)).getTime() / 1000) + " " + to24HourTimeStr(new Date(bbsData[i].lastcall_hdr_date)))
            );
        }
        lbMenu.colors.itemColor = "\x01k\x01h";
        lbMenu.colors.selectedItemColor = "\x01n\x01k\x01" + "7";
        lbMenu.AddAdditionalQuitKeys("qQsS");
        lbMenu.borderEnabled = true;
        lbMenu.topBorderText = WIDTH < 132 ? format("\x014 \x01w\x01h%-24.24s %-30.30s %-5.5s %-16.16s",
                                                    "BBS", "Address", "Calls", "Last Call") :
                             /*WIDTH===132*/ format("\x014 \x01w\x01h%-45.45s %-43.43s %-12.12s %-9.9s %-15.15s",
                                                    "BBS", "Address", "OS", "Calls", "Last Call");
        lbMenu.scrollbarEnabled = true;
        selection = lbMenu.GetVal();
        if (typeof(selection) === "number") {
            selection = parseInt(selection);
            printf(SCREEN_RESET);
            if (bbsData[selection].bbs !== system.name) {
                printf("Connecting to \x01w\x01h%s\x01n...\r\n", bbsData[selection].bbs);
                bbs.telnet_gate(bbsData[selection].address);
                printf("\x01n\r\n\r\nDisconnected from \x01c\x01h%s\x01n. \x01hWelcome back\x01n!\r\n\r\n", bbsData[selection].bbs);
            } else {
                printf("\x01nYou're \x01w\x01halready\x01n connected to \x01c\x01h%s\x01n, silly!\r\n\r\n", bbsData[selection].bbs);
            }
            console.pause();
        } else if (typeof(lbMenu.lastUserInput) === "string") {
            var lastUserInputUpper = lbMenu.lastUserInput.toUpperCase();
            if (lastUserInputUpper == "S") {
                sortMode = sortMode + 1;
                if (sortMode > sortCols.length - 1) {
                    sortMode = 0;
                }
            }
            else if (lastUserInputUpper == "Q" || lastUserInputUpper == KEY_ESC) {
                funcExit = true;
            }
        } else if (!selection) {
            funcExit = true;
        }
    }
}

function showLastCallers () {
    const ROWS = console.screen_rows - 6;
    var scriptExit = false;
    var userData = loadJson(js.exec_dir + USER_JSON);
    var bbsData = loadJson(js.exec_dir + BBS_JSON);
    var keys = "";
    var viewMode = 0;
	//userData = userData.filter(function (item) { return (new Date(item.hdr_date)).getTime() <= (new Date()).getTime(); });
    while (bbs.online && !js.terminated && !scriptExit) {
        printf(SCREEN_RESET);
        console.center("\x01n\x01hI\x01nnter\x01k\x01h-\x01n\x01hB\x01nBS \x01n\x01hL\x01nast \x01n\x01hC\x01nallers");
        print(DIVIDER);

        if (WIDTH < 132) { // Typical 80 columns
            keys = "ABMQ\r"+KEY_ESC;
            if (viewMode === 0) {
                printf("\x01k\x01h%-17.17s %-26.26s %-8.8s %-5.5s %-19.19s\r\n",
                       "Alias", "BBS", "Date", "Time", "Location");
            } else if (viewMode === 1) {
                printf("\x01k\x01h%-15.15s %-25.25s %-28.28s %-8.8s\r\n",
                       "Alias", "BBS", "Telnet Address", "OS");
            }
        } else { // "Wide" screen; 132 columns
            keys = "ABQ\r"+KEY_ESC;
            printf("\x01k\x01h%-25.25s %-26.26s %-8.8s %-5.5s %-25.25s %-27.27s %-9.9s\r\n",
                   "Alias", "BBS", "Date", "Time", "Location", "Telnet Address", "OS");
        }

        for (var i = Object.keys(userData).length - ROWS; i < Object.keys(userData).length; i++) {

            if (userData[i]===undefined){
				log(LOG_WARNING, "Skipping undefined userData row: " + i);
                continue;
            }
			
			if ((new Date(userData[i].hdr_date)).getTime() > (new Date()).getTime()) {
				log(LOG_WARNING, "Skipping future date: " + userData[i].hdr_date);
				continue;
			}
			
            if (WIDTH < 132) { // Typical 80 columns
                if (viewMode === 0) {
                    printf("\x01w\x01h%-17.17s \x01n\x01w%-26.26s \x01w\x01h%-8.8s \x01n\x01w%-5.5s \x01w\x01h%-19.19s\r\n",
                            userData[i].user, userData[i].bbs, system.datestr((new Date(userData[i].hdr_date)).getTime() / 1000), to24HourTimeStr(new Date(userData[i].hdr_date)), pipeToCtrlA(userData[i].city));
                } else if (viewMode === 1) {
                    printf("\x01w\x01h%-15.15s \x01n\x01w%-25.25s \x01w\x01h%-28.28s \x01n\x01w%-8.8s\r\n",
                            userData[i].user, userData[i].bbs, userData[i].address, userData[i].os);
                }
            } else { // "Wide" screen; 132 columns
                printf("\x01w\x01h%-25.25s \x01n\x01w%-26.26s \x01w\x01h%-8.8s \x01n\x01w%-5.5s \x01w\x01h%-25.25s \x01n\x01w%-27.27s \x01w\x01h%-9.9s\r\n",
                        userData[i].user, userData[i].bbs, system.datestr((new Date(userData[i].hdr_date)).getTime() / 1000), to24HourTimeStr(new Date(userData[i].hdr_date)), pipeToCtrlA(userData[i].city), userData[i].address, userData[i].os);
            }
        }

        print(DIVIDER);
        if (WIDTH < 132) {
            printf(centerText("\x01w\x01hQ\x01k\x01h> \x01w\x01hQ\x01nuit  \x01k\x01h" + OPT_SEP + "  \x01w\x01hB\x01k\x01h> \x01w\x01hB\x01nBSes  \x01k\x01h" + OPT_SEP + "  \x01w\x01hM\x01n\x01k\x01h> \x01w\x01hM\x01nore info  \x01k\x01h" + OPT_SEP + "  \x01w\x01hA\x01n\x01k\x01h> \x01w\x01hA\x01nbout") + " ");
        } else {
            printf(centerText("\x01w\x01hQ\x01k\x01h> \x01w\x01hQ\x01nuit  \x01k\x01h" + OPT_SEP + "  \x01w\x01hB\x01k\x01h> \x01w\x01hB\x01nBSes  \x01k\x01h" + OPT_SEP + "  \x01w\x01hA\x01n\x01k\x01h> \x01w\x01hA\x01nbout") + " ");
        }
        switch (console.getkeys(keys, K_UPPER)) {
            case "A":
                showAbout();
                break;
            case "B":
                showBBSes(bbsData);
                break;
            case "M":
                viewMode = viewMode === 1 ? 0 : 1;
                break;
            case KEY_ESC:
            case "Q":
            case "\r":
                scriptExit = true;
                break; 
        }
    }
}

function postCurrentCaller() {
    // Modifying this function could result in bad/corrupted
    // data posted to the message echo from your system.
    // Do so at your own risk. You've been warned.
    var body = ">>> BEGIN\r" +
        /* User Alias                          */ rot47(user.alias) + "\r" +
        /* BBS Name                            */ rot47(system.name) + "\r" +
        /* Current Date (MM/DD/YY or DD/MM/YY) */ rot47(system.datestr()) + "\r" + // Short date format as defined in SCFG.
        /* Current Time (HH:MMa/p)             */ rot47(to12HourTimeStr(new Date())) + "\r" +
        /* User Location (e.g.: City, St)      */ rot47(user.location) + "\r" +
        /* System OS                           */ rot47(system.platform.indexOf("Win") >= 0 ? "Windows" : system.platform) + "\r" +
        /* BBS Telnet Address                  */ rot47(system.host_name + (telnetPort ? (":" + telnetPort) : "") ) + "\r" +
        ">>> END\r\n\r\n";

    var header = {
        "to": MSG_TO,
        "from": MSG_FROM,
        "subject": MSG_SUBJ
    };

    var msgBase = new MsgBase(messageBase);
    msgBase.open();
    msgBase.save_msg(header, body);
    msgBase.close();
}

function to12HourTimeStr(d) {
    return format( "%02d:%02d%s",
                   (d.getHours() > 12 ? d.getHours() - 12 : (d.getHours() === 0 ? 12 : d.getHours())),
                   (d.getMinutes()),
                   (d.getHours() >= 12 ? "p" : "a") );
}

function to24HourTimeStr(d) {
    return format( "%02d:%02d", d.getHours(), d.getMinutes() );
}

function init() {

	// disable accidentally toggling "raw input/output" modes
	js.on_exit("console.ctrlkey_passthru = " + console.ctrlkey_passthru);
	console.ctrlkey_passthru = "Z";
	
    var settings;
    var f = new File(js.exec_dir + SETTINGS_FILE);
    if (!f.open("r")) {
        throw "Failed to open " + SETTINGS_FILE + ".";
    }
    settings = f.iniGetObject();
    f.close();
    messageBase = settings.messageBase;
    telnetPort = settings.telnetPort ? settings.telnetPort : "";

    f = new File(js.exec_dir + LAST_READ);
    if (!f.open("r")) {
        lastread = 0;
    } else {
        lastread = Number(f.read()); // previously used f.readBin(), seemed problematic
        f.close();
    }
}

function main(mode) {
    init();
    if (mode === "login") {
        // This will obey the same rules for listing the last callers as 
        // configured in SCFG.
        if (bbs.node_status != NODE_QUIET && ((system.settings&SYS_SYSSTAT) || !user.is_sysop)) {
            postCurrentCaller();
        }
    } else {
        updateDataFiles();
        showLastCallers();
    }
}

main(argv[0] ? argv[0].toLowerCase() : "");
