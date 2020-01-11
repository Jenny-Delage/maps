// marker construction
function buildMarkers( color, layerGroup, nodeObject, isPath = false, route = '' ) {
	let c = { black: "#000000", red: "#d33e00", gold: "#cb9300", blue: "#0079d3", green: "#009f82", purple: "#8c13d4", grey: "#cfcdce", redLight: "#edc8b2", goldLight: "#eddfcc", blueLight: "#b3d7ef", greenLight: "#b2e1d9", purpleLight: "#d9c0ef" }
	var marker;
	var rRose = new Array();
	var paths = new Array();
	var pathColor = c[color];
	/* Icon initialization */
	var iconNone = L.icon({
		iconUrl: 'images/ffffff-0.png',
		iconSize: [24,24],
		iconAnchor: [12, 12],
		tooltipAnchor: [0, -30]
	});

	for ( let i = 0; i < nodeObject.length; i++ ) {
		if( nodeObject[i].shape != "none" ) { marker = L.marker( nodeObject[i].loc, { icon: iconNone } ).addTo( layerGroup ); }
		else { marker = L.marker( nodeObject[i].loc, { icon: iconNone, interactive: false } ).addTo( layerGroup ); }
		if( isPath == true && nodeObject[i].waypoint == true ) { 
			paths.push( nodeObject[i].loc ); 
			// do something with route
		}

		if( nodeObject[i].shape != "none" )
		{
			iconDataUri( color, nodeObject[i].shape, nodeObject[i].symbol, marker, iconCallback );
			// replacement with Rrose popup
			// marker.bindPopup( rnodes[i].pop + '(<a href="' + rnodes[i].link + '">more...</a>)' );
			rRose[i] = new L.Rrose( { offset: new L.Point(0,-10), closeButton: false, autoPan: true } ).setContent( symFloat( nodeObject[i].symbol ) + parse( nodeObject[i].text ) + ( ( nodeObject[i].footnote.length > 0 ) ? '<hr/>' + parse( nodeObject[i].footnote ) : '' ) );

			// console.log( parse( nodeObject[i].pop ) );
			marker.bindPopup( rRose[i] );
			/*
			marker.on('mouseover', function(e) {
				e.target.openPopup();
			});
			*/
		}
		if( nodeObject[i].staticlabel == true  ) {
			marker.bindTooltip( nodeObject[i].label, {permanent: true, offset: [0, -32], opacity: 1.0, direction: "center", className: 'leaflet-tooltip-static'} );
		} else if ( nodeObject[i].shape != "none" ) {
			marker.bindTooltip( nodeObject[i].label + '<div style="margin-bottom:-4px;font-size:0;"</div>&nbsp;</div>' ); <!-- contains css fix for font size change -->
		}
	}

	// construct paths
	if( color == "grey" || color == "redLight" || color == "goldLight" || color == "blueLight" || color == "greenLight" || color == "purpleLight" )
	{
		pathColor = LightenDarkenColor( c[color], -40 );
	}
	if( paths.length ) L.polyline( paths, { color: pathColor, weight:7 } ).addTo( layerGroup );
}

// inline icon svg construction
function iconDataUri( color, shape, symbol, markerObject, iconCallback ) {
	let c = { black: "#000000", red: "#d33e00", gold: "#cb9300", blue: "#0079d3", green: "#009f82", purple: "#8c13d4", grey: "#cfcdce", redLight: "#edc8b2", goldLight: "#eddfcc", blueLight: "#b3d7ef", greenLight: "#b2e1d9", purpleLight: "#d9c0ef" }
	var shapeSize = shape.substring( shape.length - 5, shape.length );
	var fileShape = "images/" + shape + ".svg";
	var loadXmlShape = new XMLHttpRequest();
	loadXmlShape.onreadystatechange = function() {
		if ( this.readyState == 4 && this.status == 200 ) {
			var shapeSvg = loadXmlShape.responseText;

			if( shapeSize == "small" ) {
				var iconSvg = shapeSvg.replace( /addColor/g, c[color] )
				var iconUrl = encodeURI( "data:image/svg+xml;charset=utf8," + iconSvg ).replace( /\#/g, "%23" );

				iconCallback( shapeSize, markerObject, iconUrl );

			} else if( shapeSize == "large" ) {
				var fileSymbol = "images/symbols/" + symbol + ".svg";
				var loadXmlSymbol =  new XMLHttpRequest();
				loadXmlSymbol.onreadystatechange = function() {
					if ( this.readyState == 4 &&  this.status == 200 ) {
						var symbolSvg = loadXmlSymbol.responseText;
						if( color == "black" || color == "red" || color == "gold" || color == "blue" || color == "green" || color == "purple" ) {
							symbolSvg = symbolSvg
								.replace( /\#000000/g, "#fff" )
								.replace( /\#000/g, "#fff" );

						} else {
							// do nothing
						}

						var symbolUrl = encodeURI( "data:image/svg+xml," + symbolSvg ).replace( /\#/g, "%23" );
						
						var iconSvg = shapeSvg
							.replace( /addColor/g, c[color] )
							.replace( /addSymbol/g, symbolUrl );
						var iconUrl = encodeURI( "data:image/svg+xml;charset=utf8," + iconSvg ).replace( /\#/g, "%23" );

						iconCallback( shapeSize, markerObject, iconUrl );
					}
				}
				loadXmlSymbol.open( "GET", fileSymbol, true );
				loadXmlSymbol.send();
			}
		}
	}
	loadXmlShape.open( "GET", fileShape, true );
	loadXmlShape.send();
};

// icon svg to icon object callback
function iconCallback( shapeSize, markerObject, iconUrl ) {
	/* Icon initialization */
	var iconLarge = L.Icon.extend({
		options: {
			iconUrl: "images/ffffff-0.png",
			iconRetinaUrl: "images/ffffff-0.png",
			shadowUrl: "images/marker-shadow.png",
			iconSize: [48, 48],
			iconAnchor: [24, 48],
			popupAnchor: [0, 0],
			tooltipAnchor: [20, -30],
			shadowSize: [64, 64],
			shadowAnchor: [20, 64],
		}
	});
	var iconSmall = L.Icon.extend({
		options: {
			iconUrl: "images/ffffff-0.png",
			iconRetinaUrl: "images/ffffff-0.png",
			shadowUrl: "images/marker-shadow.png",
			iconSize: [30, 30],
			iconAnchor: [15, 30],
			popupAnchor: [0, 0],
			tooltipAnchor: [15, -30],
			shadowSize: [48, 48],
			shadowAnchor: [15, 48],
		}
	});
	var iconNew;

	if ( shapeSize == "small" ) { iconNew = new iconSmall( {iconUrl: iconUrl, iconRetinaUrl: iconUrl} ); }
	else if ( shapeSize == "large" ) { iconNew = new iconLarge( {iconUrl: iconUrl, iconRetinaUrl: iconUrl} ); }
	markerObject.setIcon( iconNew );
};

// map constructor
function buildMap( modeCartograph = false, mapAsset, mapAssetWidth, mapAssetHeight, mapWindowWidth = 686, mapMaxZoomMultiplier, unitName, unitsAcross, unitsPerGrid, layers, layerNames, mapNameZh ) {
	var mapWindowHeight = Math.floor( mapWindowWidth / mapAssetWidth * mapAssetHeight );
	var mapMinZoom = Math.log10( mapWindowWidth / mapAssetWidth ) / Math.log10( 2 );
	var mapMaxZoom = Math.log10( mapMaxZoomMultiplier ) / Math.log10 ( 2 ); // max zoom 3x
	var unitScale = unitsAcross / mapMaxZoomMultiplier;
	var gridsAcross = unitsAcross / unitsPerGrid;

	document.getElementById( "map" ).style.width = mapWindowWidth + "px";
	document.getElementById( "map" ).style.height = mapWindowHeight + "px";
	
	// initialize main map
	var landmap = L.tileLayer( '', { id: 'mapbox.land' } );
	var bounds = [[0,0], [mapAssetHeight, mapAssetWidth]];
	var map = L.map( "map", {
		minZoom: mapMinZoom,
		maxZoom: mapMaxZoom,
		zoomSnap: 0.05,
		maxBounds: bounds,
		maxBoundsViscosity: 1.0,
		crs: L.CRS.Simple,
		layers: [landmap, layers[0]],
		attributionControl: false
	} );
	var image = L.imageOverlay( mapAsset, bounds ).addTo( map );

	map.fitBounds( bounds );

	// layer control
	let baseLayers = new Array();
	baseLayers[layerNames[0]] = landmap;

	var overlays = new Array();
	for ( let i = 0; i < layers.length; i++ ) { overlays[layerNames[i+1]] = layers[i]; }

	L.control.layers( baseLayers, overlays,{ collapsed: true } ).addTo( map );	
	
	// add graphicScale
	// see changes by Das123 @ https://gis.stackexchange.com/questions/151745/leafletjs-how-to-set-custom-map-scale-for-a-flat-image-map-crs-simple
	var graphicScale = L.control.graphicScale({
		doubleLine: true,
		fill: 'hollow',
		showSubunits: true,
		minUnitWidth: 30,
		maxUnitsWidth: 240,
		unitsPer1000px: unitScale, // x units per 1000 pixels at max zoom. Metres is default. Has's note - how many units will the map scale within its window at max zoom?, or # of units covered by window width at max zoom
		scaleUnit: unitName // override with your own unit designation. null is default and will revert to m / km
	}).addTo(map);

	var scaleText = L.DomUtil.create('div', 'scaleText' );
	graphicScale._container.insertBefore(scaleText, graphicScale._container.firstChild);
	scaleText.innerHTML = parse( '# ' + ( ( mapNameZh.length > 0 ) ? mapNameZh + zhSlash() : '' ) + layerNames[0] + '\n' + unitsPerGrid + unitName + ' per grid unit' );

	// add hex grid
	loadTurfHexGrid( map, mapAssetWidth, mapAssetHeight, mapWindowWidth, gridsAcross );
	
	// popup to give coordinates
	function onMapOver( e ) {
		var popup = new L.Rrose( { offset: new L.Point(0,-10), maxWidth:200, closeButton: false, autoPan: false } )
			.setLatLng( e.latlng )
			.setContent( symFloat( "treasure-map" ) + 'You are located at ' + e.latlng.toString() )
			.openOn(map);
	}

	if ( modeCartograph == true ) {
		map.on( 'mouseover mousemove', onMapOver );
		map.on( 'mouseout', function(e){map.closePopup()} );
	}

	// listen for screen resize events
	// h/t https://stackoverflow.com/a/23917779/2418186
	/*
	window.addEventListener('resize', function(event){
		// get the width of the screen after the resize event
		var width = document.documentElement.clientWidth;
		// tablets are between 768 and 922 pixels wide
		// phones are less than 768 pixels wide
		if (width < 768) {
			// set the zoom level to 10
			map.setZoom(-1);
		}  else {
			// set the zoom level to 8
			map.setZoom(1);
		}
	});
	*/
}

// hex grid
function loadTurfHexGrid( map, mapAssetWidth, mapAssetHeight, mapWindowWidth, gridsAcross ) {
	var gridExtent = Math.max( mapAssetWidth, mapAssetHeight );
	var gridSize = 1000 / 108 * mapWindowWidth / gridsAcross; // 1000 mile hex grid is 108 pixels wide
	var bbox = [0, 0, gridExtent, gridExtent];
	var geojson = turf.hexGrid( bbox, gridSize, 'miles' );
	var gridLayer = L.geoJson( geojson, {
		style: {
			weight: 3,
			fillOpacity: 0,
			color: '#000000',
			opacity: 0.05,
			interactive: false
		}
	} );

	map.addLayer( gridLayer );
}

// quick text: forward slash for lang_zh
function zhSlash() { return '&nbsp;&nbsp;<div style="display:inline-block;position:relative;left:-4px;-webkit-transform:scale(0.6,0.4);letter-spacing:-20px;-webkit-text-stroke-width:2px;-webkit-text-stroke-color:#6b3720;">&#10744;</div>&nbsp;&nbsp;'; }

// quick style: symbol right-float
function symFloat( symbol ) { return '<img style="float:right;padding:2px;padding-top:0px;filter:invert(0.3) sepia(1);" width="36" height="32" src="images/symbols/' + symbol + '.svg" alt="">'; }

// color shift function
// Courtesy of Pimp Trizkit
// https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors

function LightenDarkenColor(col,amt) {
    var usePound = false;
    if ( col[0] == "#" ) {
        col = col.slice(1);
        usePound = true;
    }

    var num = parseInt(col,16);

    var r = (num >> 16) + amt;

    if ( r > 255 ) r = 255;
    else if  (r < 0) r = 0;

    var b = ((num >> 8) & 0x00FF) + amt;

    if ( b > 255 ) b = 255;
    else if  (b < 0) b = 0;

    var g = (num & 0x0000FF) + amt;

    if ( g > 255 ) g = 255;
    else if  ( g < 0 ) g = 0;

    return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
}