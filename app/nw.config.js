var nw = {};
nw.gui     = require('nw.gui')
nw.window  = nw.gui.Window.get()
nw.isDebug = nw.gui.App.argv.indexOf('--debug') > -1

if (!nw.isDebug) {
	console.log = function() {}
} else {
	// Developer Shortcuts
	document.addEventListener('keydown', function(e){
	    // F2 Opens DevTools
	    if (e.keyCode == 113) nw.window.showDevTools();
	    // F5 Reloads
	    if (e.keyCode == 116) nw.window.reloadIgnoringCache();
	});
}

// Cancel all new windows (Middle clicks / New Tab)
nw.window.on('new-win-policy', function (frame, url, policy) {
    policy.ignore();
});

// Prevent Drag&Drop
var preventDefault = function(e) { e.preventDefault() }
// Prevent dropping files into the window
window.addEventListener("dragover",   preventDefault, false);
window.addEventListener("drop",       preventDefault, false);
// Prevent dragging files outside the window
window.addEventListener("dragstart",  preventDefault, false);

if (!nw.isDebug) {
	// Show 404 page on uncaughtException
	process.on('uncaughtException', function(err) {
	  if (console) console.log(err);
	});
}

