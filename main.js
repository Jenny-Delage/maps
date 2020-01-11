// marker construction
function buildMarkers( color, layerGroup, nodeObject, isPath = false, route = '' ) {
	let c = getColors();
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
		if( nodeObject[i].shape == "none" || !nodeObject[i].text.length ) { marker = L.marker( nodeObject[i].loc, { icon: iconNone, interactive: false } ).addTo( layerGroup ); }
		else { marker = L.marker( nodeObject[i].loc, { icon: iconNone } ).addTo( layerGroup ); }
		if( isPath == true && nodeObject[i].waypoint == true ) { 
			paths.push( nodeObject[i].loc ); 
			// do something with route
		}

		if( nodeObject[i].shape != "none" )
		{
			iconDataUri( color, nodeObject[i].shape, nodeObject[i].symbol, marker, iconCallback );
			// replacement with Rrose popup
			// marker.bindPopup( rnodes[i].pop + '(<a href="' + rnodes[i].link + '">more...</a>)' );
			if( nodeObject[i].text.length )
			{
				rRose[i] = new L.Rrose( { offset: new L.Point( 0, -10 ), closeButton: false, autoPan: true } ).setContent( symFloat( nodeObject[i].symbol ) + parse( nodeObject[i].text ) + ( ( nodeObject[i].footnote.length > 0 ) ? '<hr/>' + parse( nodeObject[i].footnote ) : '' ) );
//				console.log( parse( nodeObject[i].text ) );

				marker.bindPopup( rRose[i] );
				/*
				marker.on('mouseover', function(e) {
					e.target.openPopup();
				});
				*/
			}
		}
		if( nodeObject[i].staticlabel == true  ) {
			marker.bindTooltip( '<div style="text-align:center;">' + parse( nodeObject[i].label ) + '</span>', {permanent: true, offset: [0, -32], opacity: 1.0, direction: "center", className: 'leaflet-tooltip-static'} );
		} else if ( nodeObject[i].shape != "none" ) {
			// no parse() for tooltip. I don't expect line feeds for such labels!
			marker.bindTooltip( nodeObject[i].label + '<div style="margin-bottom:-4px;font-size:0;"</div>&nbsp;</div>' ); <!-- contains css fix for font size change -->
		}
	}

	// construct paths
	if( color == "grey" || color == "redLight" || color == "goldLight" || color == "blueLight" || color == "greenLight" || color == "purpleLight" || color == "brownLight" )
	{
		pathColor = LightenDarkenColor( c[color], -40 );
	}
	if( paths.length ) L.polyline( paths, { color: pathColor, weight: 7, interactive: false } ).addTo( layerGroup );
}

// inline icon svg construction
function iconDataUri( color, shape, symbol, markerObject, iconCallback ) {
	let c = getColors();
	var shapeSize = shape.substring( shape.length - 5, shape.length );
	var fileShape = "images/" + shape + ".svg";
	var loadXmlShape = new XMLHttpRequest();
	loadXmlShape.onreadystatechange = function() {
		if( this.readyState == 4 && this.status == 200 ) {
			var shapeSvg = loadXmlShape.responseText;

			if( shapeSize == "small" ) {
				var iconSvg = shapeSvg.replace( /addColor/g, c[color] )
				var iconUrl = encodeURI( "data:image/svg+xml;charset=utf8," + iconSvg ).replace( /\#/g, "%23" );

				iconCallback( shapeSize, markerObject, iconUrl );

			} else if( shapeSize == "large" ) {
				var fileSymbol = "images/symbols/" + symbol + ".svg";
				var loadXmlSymbol =  new XMLHttpRequest();
				loadXmlSymbol.onreadystatechange = function() {
					if( this.readyState == 4 &&  this.status == 200 ) {
						var symbolSvg = loadXmlSymbol.responseText;
						if( color == "black" || color == "red" || color == "gold" || color == "blue" || color == "green" || color == "purple" || color == "brown" ) {
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
	var iconLarge = L.Icon.extend( {
		options: {
			iconUrl: "images/ffffff-0.png",
			iconRetinaUrl: "images/ffffff-0.png",
			shadowUrl: "images/marker-shadow.png",
			iconSize: [48, 48],
			iconAnchor: [24, 50], // using 48 instead of 50 to reduce fixed label overlap with flag-large marker shape
			popupAnchor: [0, 0],
			tooltipAnchor: [20, -30],
			shadowSize: [64, 64],
			shadowAnchor: [20, 64],
		}
	} );
	var iconSmall = L.Icon.extend( {
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
	} );
	var iconNew;

	if ( shapeSize == "small" ) { iconNew = new iconSmall( {iconUrl: iconUrl, iconRetinaUrl: iconUrl} ); }
	else if ( shapeSize == "large" ) { iconNew = new iconLarge( {iconUrl: iconUrl, iconRetinaUrl: iconUrl} ); }
	markerObject.setIcon( iconNew );
};

// map constructor
function buildMap( modeCartograph = false, mapAsset, mapAssetWidth, mapAssetHeight, mapMaxZoomMultiplier, unitName, unitsAcross, unitsPerGrid, layers, layerNames, mapNameZh ) {
//	var mapWindowWidth = 400;
//	var mapWindowHeight = Math.floor( mapWindowWidth / mapAssetWidth * mapAssetHeight );
	var mapWindowWidth = Math.min( mapAssetWidth * mapMaxZoomMultiplier, window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth );
	var mapWindowHeight = Math.min( mapAssetHeight * mapMaxZoomMultiplier, window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight );
	var mapMinZoom = calcMapMinZoom( mapWindowWidth, mapWindowHeight, mapAssetWidth, mapAssetHeight );
	var mapMaxZoom = Math.log10( mapMaxZoomMultiplier ) / Math.log10 ( 2 );
	var unitScale = unitsAcross * mapWindowWidth / ( mapAssetWidth * mapMaxZoomMultiplier ); // x units per 1000 pixels at max zoom. Metres is default. Has's note - how many units will the map scale within its window at max zoom?, or # of units covered by window width at max zoom
	var scaleTextHtml = parse( '# ' + ( ( mapNameZh.length > 0 ) ? mapNameZh + zhSlash() : '' ) + layerNames[0] + '\n' + unitsPerGrid + unitName + ' per grid unit' );
//	console.log( scaleTextHtml );

	document.getElementById( "map" ).style.width = mapWindowWidth + "px";
	document.getElementById( "map" ).style.height = mapWindowHeight + "px";
	
	// initialize main map
	var landmap = L.tileLayer( '', { id: 'mapbox.land' } );
	var bounds = [[0, 0], [mapAssetHeight, mapAssetWidth]];
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
	var graphicScale = new L.control.graphicScale( {
		doubleLine: true,
		fill: "hollow",
		showSubunits: true,
		minUnitWidth: Math.min( 80, mapWindowWidth * 0.1 ), // recommended 30
		maxUnitsWidth: Math.min( 300, mapWindowWidth * 0.5 ), // recommended 240
		unitsPer1000px: unitScale, // x units per 1000 pixels at max zoom. Metres is default. Has's note - how many units will the map scale within its window at max zoom?, or # of units covered by window width at max zoom
		scaleUnit: unitName // override with your own unit designation. null is default and will revert to m / km
	} );

	graphicScale.addTo( map );

	var scaleText = L.DomUtil.create( "div", "scaleText" );
	graphicScale._container.insertBefore( scaleText, graphicScale._container.firstChild );
	scaleText.innerHTML = scaleTextHtml;

	// add hex grid
	loadTurfHexGrid( map, mapAssetWidth, mapAssetHeight, unitsAcross, unitsPerGrid );
	
	// popup to give coordinates
	function onMapOver( event ) {
		var popup = new L.Rrose( { offset: new L.Point( 0,-10 ), maxWidth: 200, closeButton: false, autoPan: false } )
			.setLatLng( event.latlng )
			.setContent( symFloat( "treasure-map" ) + 'You are located at ' + event.latlng.toString() )
			.openOn( map );
	}

	if ( modeCartograph == true ) {
		map.on( "mouseover mousemove", onMapOver );
		map.on( "mouseout", function( event ){ map.closePopup() } );
	}
	
	// listen for screen resize events
	// h/t https://stackoverflow.com/a/23917779/2418186
	function onWindowResize( event ) {
		// note down old width, height, and zoom of map
		var widthOld = document.getElementById( "map" ).style.width;
		var heightOld = document.getElementById( "map" ).style.height;
		var zoomOld = map.getZoom();
		var zoomOldMultiplier = Math.pow( 2, zoomOld );
		
		
		// get the width and height of the screen after the resize event
		var widthNew = Math.min( mapAssetWidth * mapMaxZoomMultiplier, ( window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth ) );
		var heightNew = Math.min( mapAssetHeight * mapMaxZoomMultiplier, ( window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight ) );
		var boundsNew = [[0, 0], [heightNew, widthNew]];
		var minZoomNew = calcMapMinZoom( widthNew, heightNew, mapAssetWidth, mapAssetHeight );
		var unitScaleNew = unitsAcross * widthNew / ( mapAssetWidth * mapMaxZoomMultiplier );
		
		// set new window width and minZoom
		map.setMinZoom( minZoomNew );
		document.getElementById( "map" ).style.width = widthNew + "px";
		document.getElementById( "map" ).style.height = heightNew + "px";
		
		// adjust current zoom level
		if( zoomOld < minZoomNew ) { map.setZoom( minZoomNew ); }
		
		// repaint
		map.invalidateSize();
		
		// fix scale
		graphicScale.remove();
//		graphicScale.options.minUnitWidth = 0.05 * widthNew;
//		graphicScale.options.maxUnitsWidth = 0.25 * widthNew;
		graphicScale.options.unitsPer1000px = unitScaleNew;
		graphicScale.addTo( map );
		var scaleText = L.DomUtil.create( "div", "scaleText" );
		graphicScale._container.insertBefore( scaleText, graphicScale._container.firstChild );
		scaleText.innerHTML = scaleTextHtml;
	};

	window.addEventListener( "resize", onWindowResize );
}

// hex grid
function loadTurfHexGrid( map, mapAssetWidth, mapAssetHeight, unitsAcross, unitsPerGrid ) {
	var gridExtent = Math.max( mapAssetWidth, mapAssetHeight );
	var gridCellSide = mapAssetWidth * unitsPerGrid / unitsAcross / 2;
	var bbox = [-2 * gridCellSide, -2 * gridCellSide, gridExtent + 2 * gridCellSide, gridExtent + 2 * gridCellSide];
	var geojson = turf.hexGrid( bbox, gridCellSide, { options: { units: "miles" } } );
	var gridLayer = L.geoJson( geojson, {
		style: {
			weight: 3,
			fillOpacity: 0,
			color: '#000000',
			opacity: 0.075,
			interactive: false
		}
	} );

	map.addLayer( gridLayer );
}

// colors
function getColors() {
	return { black: "#000000", red: "#d33e00", gold: "#cb9300", blue: "#0079d3", green: "#009f82", purple: "#8c13d4", brown: "#543928", grey: "#cfcdce", redLight: "#edc8b2", goldLight: "#eddfcc", blueLight: "#b3d7ef", greenLight: "#b2e1d9", purpleLight: "#d9c0ef", brownLight: "#d2ad80" };
}

// calculate minimum map zoom
function calcMapMinZoom( mapWindowWidth, mapWindowHeight, mapAssetWidth, mapAssetHeight ) {
	// no need to bound upper end as mapMaxZoom since we are setting max mapWindow dimensions to mapAsset dimensions x 3
	if( mapWindowHeight > mapWindowWidth ) { return Math.log10( mapWindowHeight / mapAssetHeight ) / Math.log10( 2 ); }
	else { return Math.log10( mapWindowWidth / mapAssetWidth ) / Math.log10( 2 ); }
}

// quick text: forward slash for lang_zh
function zhSlash() { return '&nbsp;&nbsp;<span style="display:inline-block;position:relative;left:-4px;-webkit-transform:scale(0.6,0.4);-moz-transform:scale(0.6,0.4);transform:scale(0.6,0.4);letter-spacing:-20px;-webkit-text-stroke:2px rgb(107,55,32);text-stroke:2px rgb(107,55,32);">&#10744;</span>&nbsp;&nbsp;'; }

// quick style: symbol right-float
function symFloat( symbol ) { return '<img style="float:right;padding:2px;padding-top:0px;filter:invert(0.3) sepia(1);" width="32" height="32" src="images/symbols/' + symbol + '.svg" alt="">'; }

// color shift function
// Courtesy of Pimp Trizkit
// https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
function LightenDarkenColor( col, amt ) {
	var usePound = false;
	if( col[0] == "#" ) {
		col = col.slice( 1 );
		usePound = true;
	}

	var num = parseInt( col, 16 );

	var r = ( num >> 16 ) + amt;

	if ( r > 255 ) r = 255;
	else if( r < 0 ) r = 0;

	var b = ( ( num >> 8 ) & 0x00FF ) + amt;

	if( b > 255 ) b = 255;
	else if( b < 0 ) b = 0;

	var g = ( num & 0x0000FF ) + amt;

	if ( g > 255 ) g = 255;
	else if  ( g < 0 ) g = 0;

	return ( usePound ? "#" : "" ) + ( g | ( b << 8 ) | ( r << 16 )).toString( 16 );
}
