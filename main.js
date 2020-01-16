// get params
function getUrlParams() {
    var params = window.location.search.substring( 1 ).split( "&" );
    var options = {};
    for ( var i in params ) {
        var keyvalue = params[i].split( "=" );
        options[keyvalue[0]] = decodeURI( keyvalue[1] );
    }

    return options;
}

/* Layers */		
function mapDataArray() {
	var mapAttribs = new Array();
	var layerAttribs = {
		name: [],
		type: [],
		visibility: [],
		color: []
	};
	var layers = new Array();
	var nodes = new Array();
	var n = 0;
	var paths = new Array();
	var options = getUrlParams();

	var fileMap = "./data/" + ( ( options.campaign ) ? options.campaign + "/" : "" ) + ( ( options.map ) ? options.map + ".xml" : "" );
	var loadXmlMapData = new XMLHttpRequest();
	loadXmlMapData.overrideMimeType('application/xml');
	loadXmlMapData.onreadystatechange = function() {
		if( this.readyState == 4 && this.status == 200 ) {
			var mapXml = loadXmlMapData.responseXML;

			// get layer attributes
			var layerAttribsXml = mapXml.getElementsByTagName( "layer" );

			for ( let i = 0; i < layerAttribsXml.length; i++ ) {
				layerAttribs.name[i] = layerAttribsXml[i].getAttribute( "name" );
				layerAttribs.type[i] = layerAttribsXml[i].getAttribute( "type" );
				layerAttribs.visibility[i] = ( layerAttribsXml[i].getAttribute( "visibility" ) == "true" );
				layerAttribs.color[i] = layerAttribsXml[i].getAttribute( "color" );
			}

			// get node data
			var nodeXml = mapXml.getElementsByTagName( "node" );
			for ( let i = 0; i < nodeXml.length; i++ ) {
				var group = parseInt( nodeXml[i].getAttribute( "group" ) );

				if ( !nodes[group] ) { nodes[group] = []; n = 0; }
				if ( !paths[group] ) { paths[group] = []; }
				nodes[group][n] = [];
				
				nodes[group][n] = {
					label: nodeXml[i].getAttribute( "label" ),
					location: [parseFloat( nodeXml[i].getAttribute( "positionY" ) ), parseFloat( nodeXml[i].getAttribute( "positionX" ) )],
					shape: nodeXml[i].getAttribute( "shape" ),
					symbol: nodeXml[i].getAttribute( "symbol" ),
					staticLabel: ( nodeXml[i].getAttribute( "staticLabel" ) == "true" ),
					popup: getOptionalContent( nodeXml[i], "popup" ),
					sidebar: getOptionalContent( nodeXml[i], "sidebar" ),
					footnote: getOptionalContent( nodeXml[i], "footnote" )
				};
				n++;
			}

			// get path data
			var pathXml = mapXml.getElementsByTagName( "path" );
			for ( let i = 0; i < pathXml.length; i++ ) {
				var group = parseInt( pathXml[i].getAttribute( "group" ) );
				if( !paths[group].length ) { n = 0; }
				paths[group][n] = [];
				paths[group][n] = { 
					route: pathXml[i].getAttribute( "route" ),
					style: pathXml[i].getAttribute( "style" ),
					pathData: []
				};
				
				var waypointXml = pathXml[i].getElementsByTagName( "waypoint" );
				for ( let p = 0; p < waypointXml.length; p++ ) {
					paths[group][n].pathData[p] = {
						label: waypointXml[p].getAttribute( "label" ),
						waypoint: ( waypointXml[p].getAttribute( "waypoint" ) == "true" ),
						location: [parseFloat( waypointXml[p].getAttribute( "positionY" ) ), parseFloat( waypointXml[p].getAttribute( "positionX" ) )],
						shape: waypointXml[p].getAttribute( "shape" ),
						symbol: waypointXml[p].getAttribute( "symbol" ),
						staticLabel: ( waypointXml[p].getAttribute( "staticLabel" ) == "true" ),
						popup: getOptionalContent( waypointXml[p], "popup" ),
						sidebar: getOptionalContent( waypointXml[p], "sidebar" ),
						footnote: getOptionalContent( waypointXml[p], "footnote" )
					};
				}
				n++;
			}
			
			// ready to build layers
			layers = buildLayers( layerAttribs.color, nodes, paths );

			// get map attributes
			var mapAttribsXml = mapXml.getElementsByTagName( "map" );
			mapAttribs = {
				modeCartograph: mapAttribsXml[0].getAttribute( "modeCartograph" ),
				mapAsset: mapAttribsXml[0].getAttribute( "mapAsset" ),
				mapAssetWidth: mapAttribsXml[0].getAttribute( "mapAssetWidth" ),
				mapAssetHeight: mapAttribsXml[0].getAttribute( "mapAssetHeight" ),
				mapMaxZoomMultiplier: mapAttribsXml[0].getAttribute( "mapMaxZoomMultiplier" ),
				unitName: mapAttribsXml[0].getAttribute( "unitName" ),
				unitsAcross: mapAttribsXml[0].getAttribute( "unitsAcross" ),
				unitsPerGrid: mapAttribsXml[0].getAttribute( "unitsPerGrid" ),
				mapNameZh: mapAttribsXml[0].getAttribute( "mapNameZh" )
			};

			// ready to build map
			buildMap( 
				mapAttribs.modeCartograph,
				mapAttribs.mapAsset,
				mapAttribs.mapAssetWidth,
				mapAttribs.mapAssetHeight,
				mapAttribs.mapMaxZoomMultiplier,
				mapAttribs.unitName,
				mapAttribs.unitsAcross,
				mapAttribs.unitsPerGrid,
				layers,
				layerAttribs,
				mapAttribs.mapNameZh
			);
		}
	};

	loadXmlMapData.open( "GET", fileMap, true );
	loadXmlMapData.send();
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

						buildIcon( shapeSize, markerObject, iconUrl );
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

// icon construction: icon svg extractor to icon object constructor callback
function buildIcon( shapeSize, markerObject, iconUrl ) {
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

	if ( shapeSize == "small" ) { iconNew = new iconSmall( { iconUrl: iconUrl, iconRetinaUrl: iconUrl } ); }
	else if ( shapeSize == "large" ) { iconNew = new iconLarge( { iconUrl: iconUrl, iconRetinaUrl: iconUrl } ); }
	markerObject.setIcon( iconNew );
};

// marker construction
function buildMarkers( color, layerGroup, nodeObject, isPath = false, route = "", style="normal" ) {
	let c = getColors();
	var marker;
	var rRose = new Array();
	var paths = new Array();
	var pathColor = c[color];
	var pathWeight = ( ( style == "normal" ) ? 7 : 4 );
	/* Icon initialization */
	var iconNone = L.icon({
		iconUrl: 'images/ffffff-0.png',
		iconSize: [24,24],
		iconAnchor: [12, 12],
		tooltipAnchor: [0, -30]
	});

	for ( let i = 0; i < nodeObject.length; i++ ) {
		if( nodeObject[i].shape == "none" || !nodeObject[i].label.length ) { marker = L.marker( nodeObject[i].location, { icon: iconNone, interactive: false } ).addTo( layerGroup ); }
		else { marker = L.marker( nodeObject[i].location, { icon: iconNone } ).addTo( layerGroup ); }
		if( isPath == true && nodeObject[i].waypoint == true ) { 
			paths.push( nodeObject[i].location ); 
			// do something with route
		}

		if( nodeObject[i].shape != "none" )
		{
			iconDataUri( color, nodeObject[i].shape, nodeObject[i].symbol, marker, buildIcon );
			// replacement with Rrose popup
			// marker.bindPopup( rnodes[i].pop + '(<a href="' + rnodes[i].link + '">more...</a>)' );
			if( nodeObject[i].popup.length )
			{
				rRose[i] = new L.Rrose( { offset: new L.Point( 0, -10 ), closeButton: false, autoPan: true } ).setContent( symFloat( nodeObject[i].symbol ) + parse( nodeObject[i].popup ) + ( ( nodeObject[i].footnote.length > 0 ) ? '<hr/>' + parse( nodeObject[i].footnote ) : '' ) );
//				console.log( parse( nodeObject[i].text ) );

				marker.bindPopup( rRose[i] );
				/*
				marker.on('mouseover', function(e) {
					e.target.openPopup();
				});
				*/
			}
		}
		if( nodeObject[i].label.length ) {
			if( nodeObject[i].staticLabel == true  ) {
				marker.bindTooltip( '<div style="text-align:center;">' + parse( nodeObject[i].label ) + '</span>', { permanent: true, offset: [0, -32], opacity: 1.0, direction: "center", className: "leaflet-tooltip-static" } );
			} else if ( nodeObject[i].shape != "none" ) {
				// no parse() for tooltip. I don't expect line feeds for such labels!
				marker.bindTooltip( nodeObject[i].label + '<div style="margin-bottom:-4px;font-size:0;"</div>&nbsp;</div>' ); // contains css fix for font size change -->
			}
		}
	}

	// construct paths
	if( color == "grey" || color == "redLight" || color == "goldLight" || color == "blueLight" || color == "greenLight" || color == "purpleLight" || color == "brownLight" )
	{
		pathColor = LightenDarkenColor( c[color], -40 );
	}
	if( paths.length ) L.polyline( paths, { color: pathColor, weight: pathWeight, interactive: false } ).addTo( layerGroup );
}

// layer construction: layer xml extractor to layer object constructor callback
function buildLayers( layerColors, nodes, paths ) {
	var layers = new Array();

	// initialize layer array object
	for( let i = 0; i < nodes.length; i ++ ) { layers[i] = L.layerGroup(); }

	// put the layers together
	if( layers.length ) for ( let i = 0; i < layers.length; i++ ) { buildMarkers( layerColors[i+1], layers[i], nodes[i] ); };
	if( paths.length ) {
		for ( let i = 0; i < paths.length; i++ ) {
			for ( let p = 0; p < paths[i].length; p++ ) { 
				buildMarkers( layerColors[i+1], layers[i], paths[i][p].pathData, true, paths[i][p].route, paths[i][p].style ); 
			}
		}
	}
	
	return layers;
}

// map construction: layer xml extractor to map object constructor callback
function buildMap( modeCartograph = false, mapAsset, mapAssetWidth, mapAssetHeight, mapMaxZoomMultiplier, unitName, unitsAcross, unitsPerGrid, layers, layerAttribs, mapNameZh ) {
//	var mapWindowWidth = 400;
//	var mapWindowHeight = Math.floor( mapWindowWidth / mapAssetWidth * mapAssetHeight );
	var mapWindowWidth = Math.min( mapAssetWidth * mapMaxZoomMultiplier, window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth );
	var mapWindowHeight = Math.min( mapAssetHeight * mapMaxZoomMultiplier, window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight );
	var mapMinZoom = calcMapMinZoom( mapWindowWidth, mapWindowHeight, mapAssetWidth, mapAssetHeight, mapMaxZoomMultiplier );
	var mapMaxZoom = Math.log10( mapMaxZoomMultiplier ) / Math.log10 ( 2 );
	var unitScale = unitsAcross * mapWindowWidth / ( mapAssetWidth * mapMaxZoomMultiplier ); // x units per 1000 pixels at max zoom. Metres is default. Has's note - how many units will the map scale within its window at max zoom?, or # of units covered by window width at max zoom
	var scaleTextHtml = parse( "# " + ( ( mapNameZh.length ) ? mapNameZh + zhSlash() : "" ) + layerAttribs.name[0] + "\n" + unitsPerGrid + unitName + " per grid unit" );
//	console.log( scaleTextHtml );

	// set html dom elements
	document.title = "Map of " + layerAttribs.name[0];
	document.getElementById( "map" ).style.width = mapWindowWidth + "px";
	document.getElementById( "map" ).style.height = mapWindowHeight + "px";
	
	// initialize main map
	var landmap = L.tileLayer( "", { id: "mapbox.land" } );
	var bounds = [[0, 0], [mapAssetHeight, mapAssetWidth]];
	var visibleLayers = new Array();
	visibleLayers.push( landmap );
	for ( let i = 0; i < layers.length; i++ ) {
		if( layerAttribs.visibility[i+1] == true ) { visibleLayers.push( layers[i] ); }
	}
	var map = L.map( "map", {
		minZoom: mapMinZoom,
		maxZoom: mapMaxZoom,
		zoomSnap: 0.05,
		maxBounds: bounds,
		maxBoundsViscosity: 1.0,
		crs: L.CRS.Simple,
		renderer: L.canvas(),
		layers: visibleLayers,
		attributionControl: false
	} );
	// not yet tiling base map images in this implementation version
	var image = L.imageOverlay( mapAsset, bounds ).addTo( map );

	map.fitBounds( bounds );

	// layer control
	var baseLayers = new Array();
	baseLayers[layerAttribs.name[0]] = landmap;

	var overlays = new Array();
	for ( let i = 0; i < layers.length; i++ ) { overlays[layerAttribs.name[i+1]] = layers[i]; }

	L.control.layers( baseLayers, overlays, { collapsed: true } ).addTo( map );	
	
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
		var minZoomNew = calcMapMinZoom( widthNew, heightNew, mapAssetWidth, mapAssetHeight, mapMaxZoomMultiplier );
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
		graphicScale.options.minUnitWidth = Math.min( 80, widthNew * 0.1 );
		graphicScale.options.maxUnitsWidth = Math.min( 300, widthNew * 0.5 );
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

// get optional content from XML; allows exclusion of XML tags in XML when no content is specified
function getOptionalContent( tree, leaf ) {
    var content = tree.getElementsByTagName( leaf );
    var text = "";
    if ( content[0] ) { text = content[0].childNodes[0].wholeText; }
    return( text );
}

// colors
function getColors() {
	return { black: "#000000", red: "#d33e00", gold: "#cb9300", blue: "#0079d3", green: "#00775d", purple: "#8c13d4", brown: "#543928", grey: "#cfcdce", redLight: "#edc8b2", goldLight: "#eddfcc", blueLight: "#b3d7ef", greenLight: "#b2e1d9", purpleLight: "#d9c0ef", brownLight: "#d2ad80" };
}

// calculate minimum map zoom
function calcMapMinZoom( mapWindowWidth, mapWindowHeight, mapAssetWidth, mapAssetHeight, mapMaxZoomMultiplier ) {
	// no need to bound upper end as mapMaxZoom since we are setting max mapWindow dimensions to mapAsset dimensions x 3
	if( ( mapAssetHeight / mapAssetWidth ) < ( mapWindowHeight / mapWindowWidth ) ) {
		return Math.log10( Math.min( mapMaxZoomMultiplier, mapWindowHeight / mapAssetHeight ) ) / Math.log10( 2 );
	}
	else {
		return Math.log10( Math.min( mapMaxZoomMultiplier, mapWindowWidth / mapAssetWidth ) ) / Math.log10( 2 );
	}
}

// quick text: forward slash for lang_zh
function zhSlash() { return '&nbsp;<span style="display:inline-block;position:relative;left:-4px;-webkit-transform:scale(0.6,0.4);-moz-transform:scale(0.6,0.4);transform:scale(0.6,0.4);letter-spacing:-20px;-webkit-text-stroke:2px rgb(107,55,32);text-stroke:2px rgb(107,55,32);">&#10744;</span>&nbsp;'; }

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

mapDataArray();
