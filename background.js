var doDebug = true;
var lastVisited = "_LV";
var timeCountTotal = "_TCT"; //total time spent
var timeCountInst = "_TCI"; //current instance of how much time spending
var lastVisitedDiff = "_TD";
var hasFStayLong = "_SL";
var idleTimeout = 60;

//constants
var second_ms = 1000;
var minute_sec = 60;
var hour_min = 60;
var minute_ms = second_ms * minute_sec;

var checkDelay = 1000;

var minThreshold = minute_ms; //default val is 60 sec, but for debug 5 sec, controls revisit remind too
var revisitRemind = minute_ms * hour_min * 3; //default val 3 hr, if time diff is less than this it reminds you you were here...
var stayLong = minute_sec * 3 // should be like 3 mins, but rn test w 10 sec -> reminds here for 10 sec (since our counters are by secs)
var firstStayLong = minute_sec * 1

//for debug
// stayLong = 10;
// minThreshold = 5 * second_ms; 


var lastDomain = null;

function getNow() {
    return new Date().getTime();
}

function doTrack(url, state, focused){
    return url.startsWith("http") && isActive(url, state) && focused;
}

function isActive(url, state){
    //remember to hard code video sites (like youtube) cuz it thinks idle when playing video
    return state == "active" || url.includes("youtube.com");
}

function prnt(txt){
    if (doDebug){
        console.log(txt);
    }
}

function formatTime(val, isMS){
    if (isMS){
        //convert to secs
        val = Math.floor(val/1000)
    }
    //from Stack overflow
    var secs = val % 60;
    val = (val - secs) / 60;
    var mins = val % 60;
    var hrs = (val - mins) / 60;
    var ret = "";
    if (hrs > 0){
        ret += hrs + " hours ";
    }
    if (mins > 0){
        ret += mins + " mins ";
    }
    if (secs > 0){
        //secs should always be pos...
        ret += secs + " secs ";
    }
    return ret;
}

function logTime() {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function(tabs) {
        if (tabs.length > 0){
            var activeTab = tabs[0];
            var tabUrl = activeTab.url;
            var domain = new URL(tabUrl).hostname.toLowerCase();
            if (domain.startsWith("www.")) {
                domain = domain.replace("www.", "");
            }
            chrome.idle.queryState(idleTimeout, function(state) {
                // because query state is async
                chrome.windows.getCurrent(function(window) {
                    processDomain(tabUrl, domain, state, window.focused);    
                })
            });
        }
    });
}

function processDomain(url, domain, state, focused){
    prnt(url + " " + domain + " " + state + " " + focused);
    if (doTrack(url, state, focused)){
        saveTime(url, domain, state, focused);
        chrome.storage.local.get("enabled", function (result) {
            enabled = result.enabled;
            // prnt(enabled);
            if (enabled) {
                showAlert(domain);
            }
        });
        
    }
}


function stayValue(domain){
    if (domain + hasFStayLong in localStorage && localStorage[domain + hasFStayLong] == "true"){
        return stayLong;
    }else{
        return firstStayLong;
    }
}

function saveTime(url, domain, state, focused){
    
    localStorage[domain + timeCountTotal] = localStorage[domain + timeCountTotal] || 0;
    localStorage[domain + timeCountTotal]++;

    if (lastDomain === null || lastDomain != domain){
        prnt("new domain")
        //see if there is a last time
        //if last time diff is more than 60000
            //if so then set new time
            //setting new time means timeCountInst is 0
        
        if (domain + lastVisited in localStorage){
            var timeDiff = getNow() - localStorage[domain + lastVisited];
            //store a time diff to alert you were here X mins ago (potential usage)
            localStorage[domain + lastVisitedDiff] = timeDiff;
            if (timeDiff > minThreshold){
                //this is new session
                console.log("new session");
                localStorage[domain + timeCountInst] = 0;
                localStorage[domain + hasFStayLong] = false;
            }
        }else{
        //if no last time, then it means its a new domain so set inst is 0
            localStorage[domain + timeCountInst] = 0;
        }
    }else{
        //time diff is DELAY cuz we're either here already or new here
        localStorage[domain + lastVisitedDiff] = checkDelay;
    }

    localStorage[domain + lastVisited] = getNow();
    localStorage[domain + timeCountInst]++;
    lastDomain = domain;        
    
}
blacklistLH = ["facebook.com", "youtube.com", "reddit.com", "instagram.com"]
whitelistBH = ["google.com", "mail.google.com", "github.com", "stackoverflow.com", "docs.google.com", "calcentral.berkeley.edu"]

function showAlert(domain){
    //couple alerts (2 as of now)
        //revisit alert - use time diff
        //stay long alert - use time instance

    //ok right now only blacklisted sites have Last here reminder

    if(domain + lastVisitedDiff in localStorage && blacklistLH.includes(domain)){
        timeDiff = localStorage[domain + lastVisitedDiff]
        if(timeDiff > minThreshold && timeDiff < revisitRemind){
            //alert that revisit within..
            alert("Last here " + formatTime(timeDiff, true) + "ago");
        }
    }

    //stay long
    // prnt(localStorage[domain + timeCountInst]);
    //default all sites have been here, except white listed
    if (localStorage[domain + timeCountInst] >= stayValue(domain) && !whitelistBH.includes(domain)){
        alert("Been here " + formatTime(localStorage[domain + timeCountInst], false));
        //reset the counter cuz most efficient way to do
        localStorage[domain + timeCountInst] = 0;
        localStorage[domain + hasFStayLong] = true;
    }
}

function showBadge(domain){
    chrome.browserAction.setBadgeText({"text": localStorage[domain + timeCount]});
}
function hideBadge(){
    chrome.browserAction.setBadgeText({"text": ""});
}

//MAIN
localStorage.clear();
setInterval(logTime, checkDelay);



//testing
// chrome.storage.local.set({'channels': 3});
// chrome.storage.local.set({'facebook.com': 2});
// prnt('hi' in localStorage);
// localStorage['hi'] = 3;
// localStorage['hi']++;
// prnt('hi' in localStorage)
// chrome.storage.local.get(function (result) {
//         prnt(JSON.stringify(result));
//     });