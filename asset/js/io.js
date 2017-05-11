(function() {
	app.io.on('list', function(result) {
		app.records = result.records;
		app.pageNow = result.now;
		app.pageMean = result.mean;
	});

	app.io.on('listTag', function(list) {
		app.tags = list;
	});

	app.io.on('log', function(text, id, color) {
		var log = { text: text, color: color || '#557799' }, logOld = app.logDict[id];

		if(logOld) {
			logOld.text = text;
			logOld.color = color || '#557799';
		}
		else {
			if(id) app.logDict[id] = log;

			app.logs.unshift(log);
		}
	});
})();