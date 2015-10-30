// ==UserScript==
// @name       Social Media Timer
// @namespace  me.mitchgordon.timer
// @version    0.3
// @description Makes sure you don't waste your life on facebook. This app will kick you off Facebook for 30 minutes after you've been browsing for more than 5. 
// 		Place more matches in the line below to track different websites.
// @match      https://*.facebook.com/*
// @copyright  2012+, You
// ==/UserScript==

// Tampermonkey has this annoying habit of starting multiple scripts for one page with iframes
if (window.top != window.self)
    return;

// The time the site will not be blocked in seconds
var onTime = 5 * 60; 
// The time the site will be blocked in seconds
var offTime = 30 * 60;

// Is logging enabled?
var logging = false;
function log(val) {
    if (logging)
        console.log(val);
}

// The tag used to store data in local storage
var stateId = "SocialMediaTimer";

// Is this the main thread that's decrementing the timer?
var mainThread = false;

// Have we written a message to the page yet?
var written = false;

// The id of the timing event we're going to schedule.
var intervalId;

// This stuff handles when the main thread quits without cleaning up after itself
// How many times have we gotten the counter and seen the same number as before?
var sameSecondsCount = 0;
// What was the last value we saw?
var lastSeconds = 0;

// And just in case, we'll put everything in an event so it only gets called once per window load.
window.addEventListener("load", function() {
    var currentState;

    //Check if we've ever run
    //If we haven't, set the default options
    var stateString = localStorage.getItem(stateId);
    if (stateString === null) {
        currentState = {timing: false, allowed: true, secondsLeft: onTime};
        localStorage.setItem(stateId, JSON.stringify(currentState));
    }

    // Then decrement and check the timer every second
    intervalId = setInterval( everySecond, 1000);
});

window.addEventListener("beforeunload", function(evt) {
    // If we're the main thread, we need to let other threads know we're not decrementing
    // the counter any more.
    if (mainThread) {
        var stateString = localStorage.getItem(stateId);
        if (stateString !== null) {
            var currentState = JSON.parse(stateString);
            currentState.timing = false;
            localStorage.setItem(stateId, JSON.stringify(currentState));
        }
    }
});

function onTimeHandler(currentState) {

    // If the time left is less than zero, then browsing time is over.
    if (currentState.secondsLeft <= 0) {
        // Turn off the site and set a date for the site to come back on.
        currentState.allowed = false;
        currentState.timing = false;
        mainThread = false;
        var returnTime = new Date();
        returnTime.setSeconds(returnTime.getSeconds() + offTime);
        currentState.returnTime = returnTime;

        log("Time's up. Setting return time to " + currentState.returnTime);
    }
    // Otherwise, just decrement the time left
    else {
        currentState.secondsLeft = currentState.secondsLeft - 1;
        log("Decrementing time to " + currentState.secondsLeft);
    }
}

function offTimeHandler(currentState) {
    // If timer expired, then off time is over. 
    currentState.returnTime = new Date(currentState.returnTime);
    log("Time till back on: " + (currentState.returnTime - new Date()) );
    if ( new Date() > currentState.returnTime ) {
        // Reset the timer for on time.
        currentState.timing = false;
        currentState.allowed = true;
        currentState.secondsLeft = onTime;
    }
    // Otherwise, overwrite the page and tell the user when facebook will come back on.
    else if (!written) {
        document.write("<div id='status'>\rTime's up. This site will be off until " + currentState.returnTime.toTimeString() + ". Go be productive.</div>");
        document.write('<br><button id="reset">This is wrong! Give me more time!</button>');

        document.getElementById('reset').addEventListener('click', function () {
            localStorage.setItem(stateId, JSON.stringify({allowed:true, timing: false, secondsLeft: onTime}));
            location.reload();
        });

        written = true;
    }
}


// Decrements the timer and checks if it's time to switch modes.
function everySecond() {
    // Grab the current state
    var stateString = localStorage.getItem(stateId);
    if (stateString !== null) {
        var currentState = JSON.parse(stateString);

        // If the website is currently allowed to be browsed,
        // and we haven't already over-written the page, (don't count down if the user hasn't reloaded yet)
        // and we're the main thread or there is no other main thread
        log("Written: " + written);
        log("MainThread: " + mainThread);
        if (currentState.allowed && !written && (mainThread || currentState.timing === false)) {
            // Then this thread will become the main thread that decrements the timer
            mainThread = true;
            currentState.timing = true;
            onTimeHandler(currentState);
            // Save the state object
            localStorage.setItem(stateId, JSON.stringify(currentState));
        }
        else if (currentState.allowed && written) {
            // If we've already written over the page so that browsing is impossible, but the page is on
            // Tell them to refresh the page
            var status = "This page is now back on. Please refresh to browse.";
            document.getElementById("status").innerHTML = status;
            alert(status);
            clearInterval(intervalId);
        }
        else if (!currentState.allowed) {
            // Or if the site is not allowed to be browsed
            offTimeHandler(currentState);

            // Save the state object            
            localStorage.setItem(stateId, JSON.stringify(currentState));
        }
        else if (currentState.allowed) {
            // Do the check to see if the main thread bailed without cleaning up
            sameSecondsCount = (currentState.secondsLeft == lastSeconds) ? sameSecondsCount + 1 : 0;
            lastSeconds = currentState.secondsLeft;
            
            // If the timer hasn't changed in 5 seconds, take over as main thread
            if (sameSecondsCount > 5) {
                mainThread = true;
                currentState.timing = true;
                // Save the state object
                localStorage.setItem(stateId, JSON.stringify(currentState));   
            }
        }
        

        log("Current state: " + JSON.stringify(currentState));
    }

}