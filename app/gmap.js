var GMap = function GMap ( element, config ) {
	// Initialize Google Map
	this.google = google;
	this.map = new this.google.maps.Map(element, config);
	// Data array
	this.data = [];
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
		console.log(d.name, d.latlng)
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
		icon = 'http://www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png';
	} else if (!d.lastSale || (new Date() - d.lastSale) > 24*60*60*1000*365) {
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
			"<p><b>"+d.name +"</b></p>"+
			"<p>"+d.address+"<br />"+d.city+"<br />"+d.state+"</p>"+
			"<p>Teléfono: "+d.phone+"</p>"+
			"<p>Vendedor: "+d.salesman+"</p>"+
			"<p>Última Compra: "+(d.lastSale ? (d.lastSale.getDate() + "/" + (d.lastSale.getMonth() + 1) + "/" + d.lastSale.getFullYear()) : 'N/A')+"</p>"
		,
		//disableAutoPan: true	
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