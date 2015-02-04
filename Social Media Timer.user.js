// ==UserScript==
// @name       Social Media Timer
// @namespace  me.mitchgordon.timer
// @version    0.1
// @description Makes sure you don't waste your life on facebook. This app will kick you off Facebook for 30 minutes after you've been browsing for more than 5. 
// 		Place more matches in the line below to track different websites.
// @match      https://*.facebook.com/*
// @copyright  2012+, You
// ==/UserScript==

// Tampermonkey has this annoying habit of starting multiple scripts for one page with iframes
if (window.top != window.self)
    return;

var onTime = 5 * 60; //in seconds
var offTime = 30 * 60;

// Have we written a message to the page yet?
var written = false;

// The id of the timing event we're going to schedule.
var intervalId;

// And just in case, we'll put everything in an event so it only gets called once per window load.
window.addEventListener("load", function() {
    //console.log("running.");
     
    //Check if we've ever run
    //If we haven't, set the "allowed" switch that determines whether or not browsing is allowed.
    if (getCookie("allowed") === null) {
        setCookie("allowed", "true", 360, "d");
    }
    
    // If we have a time left from the last time we were browsing, use it.
    timeLeft = getCookie("timeLeft");
    // Otherwise, start a new timer.
    if (timeLeft === null)
        timeLeft = onTime;
    
    // Then decrement and check the timer every second
    intervalId = setInterval( decrementAndCheck, 1000);
});

window.addEventListener("unload", function() {
    //console.log ("Saving browsing time.");
    
 	// If we still have browsing time left, store it in a cookie to be loaded
    // next time the page is opened.
    setCookie("timeLeft", timeLeft, 360, "d");
});

// Decrements the timer and checks if it's time to switch modes.
function decrementAndCheck() {
    // Try to grab the allowed cookie 
	// We should definitely do this each second so that all tabs with the site open will be disabled at the same time.
	var allowed = getCookie("allowed");
    
    //console.log(allowed + " " + timeLeft);
    
	// If we're tracking the amount of time the user is browsing, only decrement the in memory counter
    if (allowed == "true") { 
        // If the time left is less than zero, then browsing time is over.
        if (timeLeft <= 0) {
            //console.log("Off time starting.");
            setCookie("allowed", "false", 360, "d");
            // Reset the timer for off time using expiration.
            setCookie("offTimer", new Date().toLocaleTimeString(), offTime, "s");
        }
        // Otherwise, just decrement the time left
        else {
            timeLeft -= 1;
        }
    }
    // If we're tracking the off time, use cookie expiration as the timer. This way the timer is still counting
    // even if the browser is closed.
    else {
        var offTimer = getCookie("offTimer");
        // If timer expired, then off time is over. Reset the timer for on time.
        if ( offTimer === null ) {
            //console.log("On time starting.");
        	setCookie("allowed", "true", 360, "d");
            
            // Reset the on timer for the next time we're allowed to browse.
            setCookie("timeLeft", onTime, 360, "d");
            
            // If we've already written over the page so that browsing is impossible
            if (written) {
                // Stop timing until they refresh the page.
                clearInterval(intervalId);
                
                // Tell them to refresh the page
                alert("This page is now back on. Please refresh to browse.");
            }
        }
        // Otherwise, overwrite the page and tell the user when facebook will come back on.
        else if (!written) {
            document.write("\rTime's up. This site has been off since " + offTimer + " and will be off for " + Math.round(offTime / 60) + " minutes. Go be productive.");
            document.write('<br><button id="reset">This is wrong! Give me more time!</button>');
            
            document.getElementById('reset').addEventListener('click', function () {
                setCookie("offTimer", "this is expired", -1, "d");
                location.reload();
            });
            
            written = true;
        }
    }
}                        
                        
function setCookie(c_name,value,exp, flag)
{
    var exdate=new Date();
    if (flag == "d") {
    	exdate.setDate(exdate.getDate() + exp);
    }
    if (flag == "m") {
        exdate.setTime(exdate.getTime() + exp * 60 * 1000);
    }
    if (flag == "s") {
        exdate.setTime(exdate.getTime() + exp * 1000);    
    }
   
    // Always use the root path for the domain
    var c_value=escape(value) + ((exp == null) ? "" : "; expires="+exdate.toUTCString()) + "; path=/";
	document.cookie=c_name + "=" + c_value;
}

function getCookie(c_name){
    var i,x,y,ARRcookies=document.cookie.split(";");
    for (i=0;i<ARRcookies.length;i++){
      x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
      y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
      x=x.replace(/^\s+|\s+$/g,"");
      if (x==c_name){
        return unescape(y);
      }
    }
    return null;
}

