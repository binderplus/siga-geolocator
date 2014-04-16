var GMap = function GMap ( element, config ) {
	var t = this;

	// Initialize Google Map
	t.google = google;
	t.map = new this.google.maps.Map(element, config);
	// Data array
	t.data = [];

	// Google Map Search Box
	var markers = [];
	var input = (document.getElementById('pac-input'));
  	this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  	var searchBox = new google.maps.places.SearchBox(input);
	google.maps.event.addListener(searchBox, 'places_changed', function() {
		var places = searchBox.getPlaces();
		for (var i = 0, marker; marker = markers[i]; i++) {
			marker.setMap(null);
		}

		// For each place, get the icon, place name, and location.
		markers = [];
		var bounds = new google.maps.LatLngBounds();
		for (var i = 0, place; place = places[i]; i++) {
			var image = {
				url: place.icon,
				size: new google.maps.Size(71, 71),
				origin: new google.maps.Point(0, 0),
				anchor: new google.maps.Point(17, 34),
				scaledSize: new google.maps.Size(25, 25)
			};
			// Create a marker for each place.
			var marker = new google.maps.Marker({
				map: t.map,
				icon: image,
				title: place.name,
				position: place.geometry.location
			});
			markers.push(marker);
			bounds.extend(place.geometry.location);
		}
		t.map.fitBounds(bounds);
	});
	// Bias the SearchBox results towards places that are within the bounds of the
	// current map's viewport.
	google.maps.event.addListener(t.map, 'bounds_changed', function() {
		var bounds = t.map.getBounds();
		searchBox.setBounds(bounds);
	});
}

GMap.prototype.setData = function setData ( data ) {
	this.removeData();
	this.addData(data);
}

GMap.prototype.addData = function addData ( data ) {
	_this_ = this;
	timeStart = new Date();
	// For each data item, in series.
	async.eachSeries(data, function (d, callback) {
		// unknown latlng. we shuold lookup
		if (!d.latlng || !d.latlng.lat || !d.latlng.lng) {
			_this_.geocodeLookup(d, function(error) {
				if (!error) _this_.addMarker(d);
				callback(null);
			});
		} else {
			// use existing latlng
			_this_.addMarker(d);
			callback(null);
		}
	
	}, function(err) {
		if (err) {
			console.error('Cancelled with errors.', err);
		} else {
			console.log('Finished loading. Time elapsed: ' + ((new Date()-timeStart)/1000));
		}
	});
	
}

GMap.prototype.removeData = function removeData () {
	if (!this.data) return;
	this.data.forEach(function(d) {
		d.marker.setMap(null);
	});
	this.data = [];
}


GMap.prototype.addMarker = function(d) {
	_this_ = this;
	
	// Define an icon
	if (!d.active) {
		icon = 'http://www.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png';
	} else if (!d.lastSale || (new Date() - d.lastSale) > 1000*60*60*24*365) {
		icon = 'http://www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png';
	} else if (!d.lastSale || (new Date() - d.lastSale) > 1000*60*60*24*90) {
		icon = 'http://www.google.com/intl/en_us/mapfiles/ms/micons/ltblue-dot.png';		
	} else {
		icon = 'http://www.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png';
	}

	// Add marker
	d.marker = new _this_.google.maps.Marker({
		position: new google.maps.LatLng( d.latlng.lat, d.latlng.lng ),
		map: _this_.map,
		icon: icon
	});
	
	// Set up infowindow
	d.infowindow = new _this_.google.maps.InfoWindow({
		content: 
			"<div><b>"+d.name +"</b></div>"+
			"<div>"+d.address+"</div>"+
			"<div>"+d.city+"</div>"+
			"<div>"+d.state+"</div>"+
			"<div><b>Teléfono: </b>"+d.phone+"</div>"+
			"<div><b>Vendedor: </b>"+d.salesman+"</div>"+
			"<div><b>Última Compra: </b>"+(d.lastSale ? (d.lastSale.getDate() + "/" + (d.lastSale.getMonth() + 1) + "/" + d.lastSale.getFullYear()) : 'N/A')+"</div>"+
			"<div><b>Ventas últimos 12 meses: </b>$ "+(d.lastYearWorth?d.lastYearWorth:0)+"</div>"
	});
	
	// Hookup 
	_this_.google.maps.event.addListener(d.marker, 'click', function() {
		// Toggle Open/Close
		if (!d.infowindow.isOpen) d.infowindow.open(_this_.map, d.marker);
		else d.infowindow.close();
		d.infowindow.isOpen = !d.infowindow.isOpen
	});
	
	_this_.google.maps.event.addListener(d.marker, 'mouseover', function() {
		// Hover open
		if (!d.infowindow.isOpen) d.infowindow.open(_this_.map, d.marker);
	});
	
	_this_.google.maps.event.addListener(d.marker, 'mouseout', function() {
		// Hover close
		if (!d.infowindow.isOpen) d.infowindow.close(); // close if not toggled
	});
	
	// Easy access
	d.locate = function() {
		_this_.map.panTo(d.marker.getPosition());
	}
}

GMap.prototype.geocodeLookup = function geocodeLookup ( d, callback, cityOnly ) {
	if (!this.geocoder) this.geocoder = new this.google.maps.Geocoder();
	if (!this.geocodeLookup.timeDelay)	this.geocodeLookup.timeDelay = 1000; 
	if (!this.geocodeLookup.prevItem)	this.geocodeLookup.prevItem = null; 

	_this_ = this;
	
	// Busqueda normal
	if (!cityOnly) {
		geocodeOptions = {
			address: d.address + ", " + d.city + ", " + d.state + ", " + d.country,
			componentRestrictions: {
				country: d.country,
				locality: d.state
			}
		}
		
	// Buscar sólo la localidad	
	} else {
		geocodeOptions = {
			address: d.city + ", " + d.state + ", " + d.country//,
			//componentRestrictions: {
			//	country: d.country
			//}
		}
	}
	
	// Consultar dirección
	_this_.geocoder.geocode( geocodeOptions, function(results, status) {		

		// Check OVER_QUERY_LIMIT
		if (status == _this_.google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
			// If its recurrent, add delay
			if (_this_.geocodeLookup.prevItem === d) {
				_this_.geocodeLookup.timeDelay = Math.floor(_this_.geocodeLookup.timeDelay * 1.2)
				setTimeout(function() {
					_this_.geocodeLookup.timeDelay = Math.floor(_this_.geocodeLookup.timeDelay / 1.2)
				}, 30*1000);
			}
			
			// Update prevItem
			_this_.geocodeLookup.prevItem = d;
			
			// Retry after <timeDelay> ms
			setTimeout(function() { 
				_this_.geocodeLookup(d, callback, cityOnly); 
			}, _this_.geocodeLookup.timeDelay);
			return;
		}
		
		// Also Update prevItem
		_this_.geocodeLookup.prevItem = d;

		// Check status. RETRY WITH CITY ONLY (if it can)
		if (status != _this_.google.maps.GeocoderStatus.OK) {
			if (!cityOnly) {
				console.log('Can\'t find address. Trying to locate the city');
				_this_.geocodeLookup(d, callback, true);
			} else {
				console.error('NOT_EVEN_CITY_FOUND', d);
				callback(status);
			}
			return;
		}
		
		// Fill with position
		d.latlng = { 
			lat: results[0].geometry.location.lat(),
			lng: results[0].geometry.location.lng()
		}
		
		if (cityOnly) { 
			console.log('City LOCATED!');
			// randomize a bit
			d.latlng.lat += ((Math.random()-0.5)/50)
			d.latlng.lng += ((Math.random()-0.5)/50)
		}
		
		callback(null);
	});
}