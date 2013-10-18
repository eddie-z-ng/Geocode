/* Geocode Google Maps Javascript Demo */
/*
   1) Regular searches results in a generic place marker and infowindow with lat/long centered on the map
     and an approximate StreetView if applicable.
   2) Use Autocomplete Places to populate search box. Selection of autocomplete suggestion 
     results in a unique place marker and infowindow with address/website centered on the map
	 and an approximate StreetView if applicable.
	** Current known bug: Selecting autocomplete entry and pressing 'ENTER' key will result in both codeAddress() being called
	                      and the place_changed event handler to occur right after. Other than unnecessary call, behaves OK
   4) Checkboxes to add overlays
   5) Uses jQuery UI theme "Excite-Bike"
*/

// Global object literal for the demo
var GEOCODE_DEMO = { };

/*var utilities = {
	printAllMembers: function(targetObject) {
		for (i in targetObject) {
			alert(i + " : " + targetObject[i]);
		}
	}
}*/

// Clears overlays
function clearOverlays() {
  for (i = 0; i< GEOCODE_DEMO.overlaysArray.length; i++ )
  {
	GEOCODE_DEMO.overlaysArray[i].setMap(null);
  }
};

function initialize() {
	GEOCODE_DEMO.gCoder = new google.maps.Geocoder();
	
	// Add all overlays/layers into overlaysArray
	GEOCODE_DEMO.overlaysArray = [];
	GEOCODE_DEMO.weatherLayer = new google.maps.weather.WeatherLayer({
		temperatureUnits: google.maps.weather.TemperatureUnit.FAHRENHEIT
	});
	GEOCODE_DEMO.cloudLayer = new google.maps.weather.CloudLayer();
	GEOCODE_DEMO.trafficLayer = new google.maps.TrafficLayer();
	GEOCODE_DEMO.transitLayer = new google.maps.TransitLayer();
	GEOCODE_DEMO.panoramioLayer = new google.maps.panoramio.PanoramioLayer();
	GEOCODE_DEMO.overlaysArray.push(GEOCODE_DEMO.weatherLayer);
	GEOCODE_DEMO.overlaysArray.push(GEOCODE_DEMO.cloudLayer);
	GEOCODE_DEMO.overlaysArray.push(GEOCODE_DEMO.trafficLayer);
	GEOCODE_DEMO.overlaysArray.push(GEOCODE_DEMO.transitLayer);
	GEOCODE_DEMO.overlaysArray.push(GEOCODE_DEMO.panoramioLayer);
	
	GEOCODE_DEMO.infowindow = new google.maps.InfoWindow();
	GEOCODE_DEMO.markersArray = [];
	var latlng = new google.maps.LatLng(40.7143528,-74.0059731) // Initialize to NYC
	var mapOptions = {
	  zoom: 6,
	  center: latlng,
	  mapTypeControlOptions: { 
		mapTypeIds: [google.maps.MapTypeId.HYBRID, 
			google.maps.MapTypeId.ROADMAP, 
			google.maps.MapTypeId.SATELLITE, 
			google.maps.MapTypeId.TERRAIN]
		},
	  mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	GEOCODE_DEMO.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	
	var panoOptions = {
	  clickToGo: true,
	  position: latlng,
	  visible: true
	};
	
	GEOCODE_DEMO.sViewPano = new google.maps.StreetViewPanorama(document.getElementById("streetview-canvas"), panoOptions);
	GEOCODE_DEMO.sViewPano.setPov( {
		heading: 34,
		pitch: 10,
		zoom: 1
	});
	
	// Bind the Streetview Panorama to this map so Streetview is displayed on its own canvas
	GEOCODE_DEMO.map.setStreetView(GEOCODE_DEMO.sViewPano); 
	GEOCODE_DEMO.sView = GEOCODE_DEMO.map.getStreetView();
	GEOCODE_DEMO.sView.setPosition(latlng);
			  
	var input = document.getElementById('address');
	var autocomplete = new google.maps.places.Autocomplete(input);
	autocomplete.bindTo('bounds', GEOCODE_DEMO.map);
	
	GEOCODE_DEMO.gCoder.geocode( { 'latLng': latlng}, function(results, status) {
	  if (status == google.maps.GeocoderStatus.OK) {
		setMapAndSview(results[0]);
	  } else {
			$('#alertMessage').text("Geocode was not successful for the following reason: " + status);
			$('#alertGroup').show();
	  }
	});
	
	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		input.className = '';
		var place = autocomplete.getPlace();
		if (!place.geometry) {
		  // Inform the user that the place was not found and return.
		  input.className = 'notfound';
		  return;
		}
		setMapAndSview(place);
	});
};

function codeAddress() {
	//$("#divResult").fadeOut();
	var address = document.getElementById("address").value;
	if (address !== '') {
		GEOCODE_DEMO.gCoder.geocode( { 'address': address}, function(results, status) {
		  if (status === google.maps.GeocoderStatus.OK) {
			setMapAndSview(results[0]);
		  } else {
				if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
					$('#alertMessage').text("Too many requests. Please try again shortly");
				}
				else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
					$('#alertMessage').text("No results founds. Please try another search");
				}
				else{
					$('#alertMessage').text("Geocode was failed for the following reason: " + status);
				}
				$('#alertGroup').show();
		  } 
		});
	}
};

function setMapAndSview (newloc) {
	$('#alertGroup').hide();
	
	// Reset to No Layer each time we set a new map and streetview position
    $('#clearAllButton').click();
	
	// Clear all markers
	for (var i = 0; i < GEOCODE_DEMO.markersArray.length; i++ ) {
		GEOCODE_DEMO.markersArray[i].setMap(null);
	}
	GEOCODE_DEMO.markersArray = [];

	// If the place has a geometry, then present it on a map.
	if (newloc.geometry.viewport) {
		  GEOCODE_DEMO.map.fitBounds(newloc.geometry.viewport);
	} else {
		GEOCODE_DEMO.map.panTo(newloc.geometry.location);
		GEOCODE_DEMO.map.setCenter(newloc.geometry.location);
		GEOCODE_DEMO.map.setZoom(18);
	}

	var client = new google.maps.StreetViewService(); 
	client.getPanoramaByLocation(newloc.geometry.location, 200, function(res, status) { 
	  if (status === google.maps.StreetViewStatus.OK) { 
		
		GEOCODE_DEMO.sViewPano = res.location.pano;
		GEOCODE_DEMO.sView = GEOCODE_DEMO.map.getStreetView();
		// Set position of the streetview to closest panorama in 200 meter radius
		GEOCODE_DEMO.sView.setPosition(res.location.latLng);
	  } 
	  else
	  {
		//GEOCODE_DEMO.map.streetViewControlOptions.position = 0;
		$('#alertMessage').text("Unable to find closest streetview panorama within 200 meters. Please be more specific");
		$('#alertGroup').show();
	  }
	}); 
	
	var marker = new google.maps.Marker({
		map: GEOCODE_DEMO.map,
		position: newloc.geometry.location,
		title: newloc.formatted_address
	});
	
	if (newloc.icon)
	{
	    // @type {google.maps.Icon}
		marker.setIcon(({
		  url: newloc.icon,
		  size: new google.maps.Size(71, 71),
		  origin: new google.maps.Point(0, 0),
		  anchor: new google.maps.Point(17, 34),
		  scaledSize: new google.maps.Size(35, 35)
		}));
	}
	marker.setPosition(newloc.geometry.location);
	marker.setVisible(true);
	GEOCODE_DEMO.markersArray.push(marker);
    
	var placeInfo = '';
	if (newloc.address_components && newloc.name){
		  placeInfo = [
			(newloc.address_components[0] && newloc.address_components[0].short_name || ''),
			(newloc.address_components[1] && newloc.address_components[1].short_name || ''),
			(newloc.address_components[2] && newloc.address_components[2].short_name || '')
		  ].join(' ');
		  if (newloc.website) {
			placeInfo = placeInfo + '<br><a href="' + newloc.website + '">' + newloc.website + '</a>';
		  }
		  GEOCODE_DEMO.infowindow.setContent('<div><strong>' + newloc.name + '</strong><br>' + placeInfo + '</div>');
	} else {
		placeInfo = GEOCODE_DEMO.map.getCenter().lat() + "," + GEOCODE_DEMO.map.getCenter().lng();
		GEOCODE_DEMO.infowindow.setContent('<div><strong>' + newloc.formatted_address + '</strong><br>' + placeInfo + '</div>');
	}
	GEOCODE_DEMO.infowindow.open(GEOCODE_DEMO.map, marker);
};

/* //Reverse Geocoding 
function formatResults(results) {
	var res = "";
	jQuery.each(results, function (i, val) {
		console.log(val.formatted_address);
		res += "<div class=\"display_box\" align=\"left\">";
		res += "<span class=\"location\">";
		res += val.formatted_address;
		res += "</span>";
		res += "<br/>";
		res += "</div>";
	});

	return res;
};*/

$(function () {

	initialize();

	//$('.pac-item').addClass("ui-menu-item");
	
	$('#searchButton').click(codeAddress);
	$('#address').keypress(function(e){
        if(e.which == 13){	//Enter key pressed
            codeAddress();	//Trigger search button click event
        }
    });
	
	$('#alertGroup').hide();
	
	$('.bigButton').button();
	$('#layerselect').buttonset();
	
	$('#layerselect :checkbox').click(function () {
		var element = $(this);
		var selectedIndex = element.index();
		// Selected Index increments by 2 for each button (includes label)
		// but 0th and 1st element in overlaysArray correspond to WeatherLayer + CloudLayer
		// overlaysArray[0], overlaysArray[1] ==> selectedIndex 0
		// overlaysArray[2] ==> selectedIndex 2
		// overlaysArray[3] ==> selectedIndex 4
		// etc...
		if (selectedIndex === 0) {
			if(element.prop("checked")) {
				GEOCODE_DEMO.overlaysArray[0].setMap(GEOCODE_DEMO.map);
				GEOCODE_DEMO.overlaysArray[1].setMap(GEOCODE_DEMO.map);
			}
			else {
				GEOCODE_DEMO.overlaysArray[0].setMap(null);
				GEOCODE_DEMO.overlaysArray[1].setMap(null);
			}
		}
		else {
			if(element.prop("checked")) {
				GEOCODE_DEMO.overlaysArray[(selectedIndex/2)+1].setMap(GEOCODE_DEMO.map);
			}
			else {
				GEOCODE_DEMO.overlaysArray[(selectedIndex/2)+1].setMap(null);
			}
		}
	});
	
	$('#clearAllButton').click(function () {
		$('#layerselect .checkall').prop("checked", false).button("refresh");
		clearOverlays();
	});
	
	$('#selectAllButton').click(function () {
		$('#layerselect .checkall').prop("checked", true).button("refresh");
		for (i = 0; i< GEOCODE_DEMO.overlaysArray.length; i++ )
		{
			GEOCODE_DEMO.overlaysArray[i].setMap(GEOCODE_DEMO.map);
		}
	});
	
	
	/*utilities.printAllMembers(GEOCODE_DEMO);
	//$('#address').attr("autocomplete","off");*/
	
	/* //Reverse Geocoding
	$('#address').keyup(function () {
		var inputSearch = $(this).val();
		var d = document.getElementById("divResult");
		if (inputSearch != '') {
			GEOCODE_DEMO.gCoder.geocode( 
			{
				address: inputSearch,
				region: 'no'
			}, function (results, status) {
				if (status === google.maps.GeocoderStatus.OK) {
					//d.html(formatResults(results)).show();
					$("#divResult").html(formatResults(results)).show();
				}
			});
		} return false;
	});*/
	
	/* //Reverse Geocoding
	$('#divResult').on("click", function (e) {
		var $clicked = $(e.target);
		var $location = $clicked.text(); //$clicked.find('.location').html();
		        console.log("#divResult click: clicked:")
                console.log($clicked);
                console.log("#divResult click: location: ");
                console.log($location);
		if ($location !== undefined && $location !== null) {
			//var decoded = $("<div/>").html($location).text();
			//$('#address').val(decoded);
			$('#address').val($location);
			codeAddress();
		}
	}); 
	
	$('#address').focusout(function () {
		$('#divResult').fadeOut();
	});
	*/
});