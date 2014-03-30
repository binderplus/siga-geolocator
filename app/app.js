google.maps.event.addDomListener(window, 'load', function() {

	window.map = new GMap(document.getElementById("googleMap"), {
		center: new google.maps.LatLng(-32.784839,-60.726546),
		zoom: 5,
		mapTypeId:google.maps.MapTypeId.ROADMAP,
		disableDefaultUI: true
	});

	function initSQLITE(callback) {
		// Initialize SQLITE
		var sqlite = require('node-sqlite-purejs')
		sqlite.open('db.sqlite', {}, function(err, db) {
			if (err) { callback(err); return; }
			db.exec('CREATE TABLE IF NOT EXISTS customers (id INTEGER, name TEXT, address TEXT, city TEXT, state TEXT, lat NUM, lng NUM);', 
				function(err) {
					callback(err, db);
				})
		})
	}

	var tedious = require('tedious');
	function initSQLEXPRESS(callback) {
		// Initialize SQLEXPRESS
		try {
			var conn = new tedious.Connection({
			  userName: 'ReadOnly',
			  password: 'readonly',
			  server:   'localhost',
			  options: {
			    instanceName: 'SQLExpress',
			    databaseName: 'SIGA'
			  }
			})
			conn.on('connect', function(err) {
				callback(err, conn);
			})
		} catch (e) {
			err = new Error('Failed to connect SQLEXPRESS.\n' + e);
			callback(err);
		}
	}

	async.parallel([
		initSQLITE,
		initSQLEXPRESS
	], function(err, res) {
		if (err) throw err;

		var sqlitedb	= res[0];
		var sqlConn		= res[1];

		async.waterfall([
			function getSQLdata(callback) {
				var data = []; var i = 0;
				var q = require('fs').readFileSync('app/sql/ClientesUltimaVenta.sql', 'utf8');
				var r = new tedious.Request(q, function(err) {
					callback(err, data);
				})

				r.on('row', function(columns) {
					var row = {}
					columns.forEach(function(col) {
						row[col.metadata.colName] = col.value
					})
					
					// Add to data array
					d = {
						id:				Number(row.NroDocumento),
						name:			row.NombreCliente,
						address:		row.Direccion,
						city:			row.NombreLocalidad,
						state: 			row.NombreProvincia, 
						postalCode: 	row.CodigoPostal,
						country:		'AR',
						active:			Number(row.Activo),
						phone:			row.Telefono + '; ' + row.Celular,
						lastSale:		row.UltimaVenta
					}
					if (!!d.active) {
						data[i] = d;
						i++;
					}
				})
				sqlConn.execSql(r);
			},

			function geocodeLookup(data, callback) {
				async.eachSeries(data, function(d, cb) {
					sqlitedb.exec('SELECT * FROM customers WHERE id = ' + d.id, function(err, result) {
						if (err) { cb(err); return; }
						if (result.length) {
							if 	(	(result[0].address 	== d.address)
								&&	(result[0].city		== d.city)
								&&	(result[0].state	== d.state)
							) {
								d.latlng = {}
								d.latlng.lat = parseFloat(result[0].lat);
								d.latlng.lng = parseFloat(result[0].lng);
							} else {
								sqlitedb.exec('DELETE FROM customers WHERE id = ' + d.id);
							}
						}
						// geocodeLookup
						if (!d.latlng) {
							console.log('GEOLOCATE: ' + d.name + '(' + d.address + ', ' + d.city + ')')
							window.map.geocodeLookup(d, function() {
								sqlitedb.exec('INSERT OR REPLACE INTO customers VALUES (' +
									[ d.id
									, "'" + d.name.replace("'", "\\'") + "'"
									, "'" + d.address.replace("'", "\\'") + "'"
									, "'" + d.city.replace("'", "\\'") + "'"
									, "'" + d.state.replace("'", "\\'") + "'"
									, "'" + d.latlng.lat + "'"
									, "'" + d.latlng.lng + "'"
								].join(', ') + ')', function(err) {
									if (err) { cb(err); return; }
									cb();
								})
							})
						} else {
							//console.log('CACHED: ' + d.name + '(' + d.address + ', ' + d.city + ')')
							cb();
						}
					})
				}, function(err) {
					if (err) { callback(err); return; }
					callback(null, data);
				})
			}
		], function (err, data) {
			if (err) throw err;
			window.data = data;
			window.map.setData(data);
		})
	})
});