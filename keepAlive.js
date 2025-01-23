// keep-alive.js

let timeoutId;
let warningTimeoutId;
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_TIMEOUT = 14 * 60 * 1000; // 14 minutes
const KEEP_ALIVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

function getUserRole() {
    // Replace this with your actual logic to get the user role
    return localStorage.getItem('userRole'); // Example: 'admin' or 'user'
}

function startKeepAlive() {
    timeoutId = setTimeout(logoutUser, SESSION_TIMEOUT);
    warningTimeoutId = setTimeout(showWarning, WARNING_TIMEOUT);

    // Reset the timers on user activity
    document.onmousemove = resetTimers;
    document.onkeypress = resetTimers;
    document.onclick = resetTimers;
    window.onload = resetTimers; // Reset timers on page load
}

function resetTimers() {
    clearTimeout(timeoutId);
    clearTimeout(warningTimeoutId);
    startKeepAlive();
}

function showWarning() {
    const stayLoggedIn = confirm("You will be logged out in 1 minute due to inactivity. Click OK to stay logged in.");
    if (stayLoggedIn) {
        resetTimers();
    } else {
        logoutUser();
    }
}

function logoutUser() {
    const userRole = getUserRole();
    let logoutUrl;

    if (userRole === 'admin') {
        logoutUrl = '/admin/logout'; // Admin logout route
    } else if (userRole === 'user') {
        logoutUrl = '/logout'; // User logout route
    } 

    alert("You have been logged out due to inactivity.");
    window.location.href = logoutUrl; // Redirect to the appropriate logout endpoint
}

function sendKeepAliveRequest() {
    fetch('/keep-alive', { method: 'GET', credentials: 'include' })
        .then(response => {
            if (!response.ok) {
                console.error('Keep-alive request failed:', response.status);
            }
        })
        .catch(error => {
            console.error('Error during keep-alive request:', error);
        });
}

setInterval(sendKeepAliveRequest, KEEP_ALIVE_INTERVAL);

startKeepAlive();