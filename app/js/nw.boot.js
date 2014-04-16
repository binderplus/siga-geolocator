// Easier access
var nw 		= nwDispatcher;
nw.gui  	= nwDispatcher.requireNwGui();
nw.window 	= nw.gui.Window.get();

// GLOBAL isDebug argv
var isDebug = nw.gui.App.argv.indexOf('--debug') > -1

// Developer Shortcuts
document.addEventListener('keydown', function(e){
    // F2 Opens DevTools
    if (e.keyCode == 113) nw.window.showDevTools();
    // F5 Reloads
    if (e.keyCode == 116) nw.window.reloadIgnoringCache();
});

// Cancel all new windows (Middle clicks / New Tab)
nw.window.on('new-win-policy', function (frame, url, policy) {
    policy.ignore();
});


var preventDefault = function(e) 		{ e.preventDefault() }
// Prevent dropping files into the window
window.addEventListener("dragover",		preventDefault, false);
window.addEventListener("drop",			preventDefault, false);
// Prevent dragging files outside the window
window.addEventListener("dragstart",	preventDefault, false);

// Catch uncaught NodeJS exceptions
process.on('uncaughtException', function(err) {
	if (console) 	console.error(err, err.stack)
	if (alert)	alert(err + '\r\n' + err.stack)
});

// Catch uncaught DOM exceptions
window.onerror = function (message, url, line) {
	if (console)	console.error('Uncaught Exception: ', message, url + ':' + line)
	if (alert)		alert('Uncaught Exception: ' +'\r\n' + message + '\r\n' + url + ':' + line)
}