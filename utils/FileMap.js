const path = require('node:path');

module.exports = class FileMap extends Map {
	get(key) {
		// ./path/to/file.js -> C:/full/path/to/file.js
		if (key.startsWith('./') || key.startsWith('../')) {
			const callerFile = getCallerFile();
			if (!callerFile) return super.get(key);
			const absolutePath = path.resolve(path.dirname(callerFile), key);
			return super.get(absolutePath);
		}
		return super.get(key);
	}
}

const prepareStackTrace = Error.prepareStackTrace;

function stackOverride (err, stack) { return stack; }

function getCallerFile() {
	try {
		const err = new Error();
	
		Error.prepareStackTrace = stackOverride;
	
		// err.stack is an array of CallSite objects
		// These are hidden from users and generally unaccessible
		const currentfile = err.stack.shift().getFileName();
	
		// Iterate through the stack frames until we find a different file
		// We want to ignore everything from this file
		while (err.stack.length) {
			var callerfile = err.stack.shift().getFileName();
	
			if (currentfile !== callerfile) break;
		}
	} catch (e) {}
  
	Error.prepareStackTrace = prepareStackTrace;
  
	return callerfile;
}
  