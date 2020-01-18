window.addEventListener( "load", function() {

// get params
function getUrlParams() {
    var params = window.location.search.substring( 1 ).split( "&" );
    var options = {};
    for ( var i in params ) {
        var keyvalue = params[i].toLowerCase().split( "=" );
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
		color: [],
		chapter: []
	};
	var group = 0;
	var n = 0;
	var layers = new Array();
	var nodes = new Array();
	var paths = new Array();
	var options = getUrlParams();
	var chapters = ( options.chapter ) ? options.chapter.split( "|" ) : [];

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
				layerAttribs.chapter[i] = ( layerAttribsXml[i].getAttribute( "chapter" ) ) ? layerAttribsXml[i].getAttribute( "chapter" ) : "";
			}

			// get node data
			var nodeXml = mapXml.getElementsByTagName( "node" );
			for ( let i = 0; i < nodeXml.length; i++ ) {
				group = parseInt( nodeXml[i].getAttribute( "group" ) );
				if ( !nodes[group] ) { nodes[group] = []; n = 0; }
				if( !paths[group] ) { paths[group] = []; }

				if( !layerAttribs.chapter[group+1].length || chapters.findIndex( e => e == layerAttribs.chapter[group+1] ) > -1 ) {
					nodes[group][n] = {
						label: ( nodeXml[i].getAttribute( "label" ) ) ? nodeXml[i].getAttribute( "label" ) : "",
						location: [parseFloat( nodeXml[i].getAttribute( "positionY" ) ), parseFloat( nodeXml[i].getAttribute( "positionX" ) )],
						shape: ( nodeXml[i].getAttribute( "shape" ) !="" && nodeXml[i].getAttribute( "shape" ) ) ? nodeXml[i].getAttribute( "shape" ) : "none",
						symbol: ( nodeXml[i].getAttribute( "symbol" ) ) ? nodeXml[i].getAttribute( "symbol" ) : "",
						staticLabel: ( nodeXml[i].getAttribute( "staticLabel" ) == "true" ),
						rotateLabel: ( nodeXml[i].getAttribute( "rotateLabel" ) ) ? parseFloat( nodeXml[i].getAttribute( "rotateLabel" ) ) : 0.0,
						popup: getOptionalContent( nodeXml[i], "popup" ),
						sidebar: getOptionalContent( nodeXml[i], "sidebar" ),
						footnote: getOptionalContent( nodeXml[i], "footnote" )
					};
					n++;
				}
			}

			// get path data
			var pathXml = mapXml.getElementsByTagName( "path" );
			for ( let i = 0; i < pathXml.length; i++ ) {
				group = parseInt( pathXml[i].getAttribute( "group" ) );
				if( !paths[group].length ) { n = 0; }

				if( !layerAttribs.chapter[group+1].length || chapters.findIndex( e => e == layerAttribs.chapter[group+1] ) > -1 ) {
					paths[group][n] = { 
						route: pathXml[i].getAttribute( "route" ),
						style: ( pathXml[i].getAttribute( "style" ) ) ? pathXml[i].getAttribute( "style" ) : "normal solid",
						symbol: ( pathXml[i].getAttribute( "symbol" ) ) ? pathXml[i].getAttribute( "symbol" ) : "",
						pathData: []
					};
					
					var waypointXml = pathXml[i].getElementsByTagName( "waypoint" );
					for ( let p = 0; p < waypointXml.length; p++ ) {
						paths[group][n].pathData[p] = {
							label: ( waypointXml[p].getAttribute( "label" ) ) ?  waypointXml[p].getAttribute( "label" ) : "",
							waypoint: ( waypointXml[p].getAttribute( "waypoint" ) == "true" ),
							location: [parseFloat( waypointXml[p].getAttribute( "positionY" ) ), parseFloat( waypointXml[p].getAttribute( "positionX" ) )],
							shape: ( waypointXml[p].getAttribute( "shape" ) !="" && waypointXml[p].getAttribute( "shape" ) ) ? waypointXml[p].getAttribute( "shape" ) : "none",
							symbol: ( waypointXml[p].getAttribute( "symbol" ) ) ? waypointXml[p].getAttribute( "symbol" ) : "",
							staticLabel: ( waypointXml[p].getAttribute( "staticLabel" ) == "true" ),
							rotateLabel: ( waypointXml[p].getAttribute( "rotateLabel" ) ) ? parseFloat( waypointXml[p].getAttribute( "rotateLabel" ) ) : 0.0,
							popup: getOptionalContent( waypointXml[p], "popup" ),
							sidebar: getOptionalContent( waypointXml[p], "sidebar" ),
							footnote: getOptionalContent( waypointXml[p], "footnote" )
						};
					}
					n++;
				}
			}

			// ready to build layers
			layers = buildLayers( layerAttribs.color, nodes, paths );

			// get map attributes
			var mapAttribsXml = mapXml.getElementsByTagName( "map" );
			mapAttribs = {
				modeCartograph: ( mapAttribsXml[0].getAttribute( "modeCartograph" ) == "true" ),
				mapAsset: mapAttribsXml[0].getAttribute( "mapAsset" ),
				mapAssetWidth: parseInt( mapAttribsXml[0].getAttribute( "mapAssetWidth" ) ),
				mapAssetHeight: parseInt( mapAttribsXml[0].getAttribute( "mapAssetHeight" ) ),
				mapMaxZoomMultiplier: mapAttribsXml[0].getAttribute( "mapMaxZoomMultiplier" ),
				unitName: mapAttribsXml[0].getAttribute( "unitName" ),
				unitsAcross: parseFloat( mapAttribsXml[0].getAttribute( "unitsAcross" ) ),
				unitsPerGrid: parseFloat( mapAttribsXml[0].getAttribute( "unitsPerGrid" ) ),
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
function buildMarkers( color, layerGroup, nodeObject, isPath = false, pathAttribs = { route: "", style: "normal solid", symbol: "", group: 0 } ) {
	if( nodeObject ) {
		var c = getColors();
		var marker;
		var rRose = new Array();
		/* Icon initialization */
		var iconNone = L.icon( {
			iconUrl: 'images/ffffff-0.png',
			iconSize: [24,24],
			iconAnchor: [12, 12],
			tooltipAnchor: [0, -30]
		} );
		var paths = new Array();

		for ( let i = 0; i < nodeObject.length; i++ ) {
			// choose between interactive or non interactive marker
			if( nodeObject[i].shape == "none" || nodeObject[i].staticLabel == true && !nodeObject[i].popup.length && !nodeObject[i].sidebar.length ) { marker = L.marker( nodeObject[i].location, { icon: iconNone, interactive: false } ).addTo( layerGroup ); }
			else { marker = L.marker( nodeObject[i].location, { icon: iconNone } ).addTo( layerGroup ); }

			// assemble polyline for connected waypoints in a path
			if( isPath == true && nodeObject[i].waypoint == true ) { 
				paths.push( nodeObject[i].location ); 
				// do something with pathAttribs.route
			}

			if( nodeObject[i].shape != "none" )
			{
				// build marker icon
				iconDataUri( color, nodeObject[i].shape, nodeObject[i].symbol, marker, buildIcon );

				// assign popup content
				// replacement with Rrose popup
				// marker.bindPopup( rnodes[i].pop + '(<a href="' + rnodes[i].link + '">more...</a>)' );
				if( nodeObject[i].popup.length )
				{
					rRose[i] = new L.Rrose( { offset: new L.Point( 0, -10 ), closeButton: false, autoPan: true } ).setContent( symFloat( nodeObject[i].symbol ) + parse( nodeObject[i].popup ) + ( ( nodeObject[i].footnote.length > 0 ) ? '<hr/>' + parse( nodeObject[i].footnote ) : '' ) );

					marker.bindPopup( rRose[i] );
					/*
					marker.on( "mouseover", function( event ) {
						event.target.openPopup();
					} );
					*/
				}
			}

			// create label
			if( nodeObject[i].label.length ) {
				if( nodeObject[i].staticLabel == true  ) {
					// additional option to rotate label if static
					marker.bindTooltip( '<div style="text-align:center;transform:rotate(-' + nodeObject[i].rotateLabel + 'deg);-webkit-transform:rotate(-' + nodeObject[i].rotateLabel + 'deg);-moz-transform:rotate(-' + nodeObject[i].rotateLabel + 'deg);">' + parse( nodeObject[i].label ) + '</div>', { permanent: true, offset: [0, -32], opacity: 1.0, direction: "center", className: "leaflet-tooltip-static" } );
				} else if ( nodeObject[i].shape != "none" ) {
					// no parse() for tooltip label. I don't expect line feeds for such labels!
					marker.bindTooltip( nodeObject[i].label + '<div style="margin-bottom:-4px;font-size:0;"</div>&nbsp;</div>' ); // contains css fix for font size change
				}
			}
		}
	}

	// construct paths
	if( paths.length ) { 
		var pathPolyline;
		var pathStyle = {};
		// pathAttribs.style = normal / thin + separated by a space + solid / dotted / dashed
		// splitting style into weight and stroke 
		pathStyle.weight = ( pathAttribs.style.split( " " )[0] == "normal" ) ? 6 : 3;
		switch( pathAttribs.style.split( " " )[1] ) {
			case "solid": pathStyle.stroke = ""; break;
			case "dotted": pathStyle.stroke = "6 18"; break;
			case "dashed": pathStyle.stroke = "12 12"; break;
		}
		pathStyle.symbolSize = "24px";
		pathStyle.symbolDy = 8;
		switch( pathAttribs.symbol ) {
			case "arrow": pathStyle.symbol = "\u27A4"; break; // instead of \u276F
			case "circle": pathStyle.symbol = "\u25CF"; break;
			case "fisheye": pathStyle.symbol = "\u25C9"; break;
			case "star": pathStyle.symbol = "\u2737"; break;
			case "cross": pathStyle.symbol = "\u271A"; break;
			case "x-mark": pathStyle.symbol = "\u2A2F"; break;
			case "asterisk": pathStyle.symbol = "\u2731"; break;
		}
		if( color == "grey" || color == "redLight" || color == "goldLight" || color == "blueLight" || color == "greenLight" || color == "purpleLight" || color == "brownLight" )
		{
			pathStyle.color = LightenDarkenColor( c[color], -40 );
			pathStyle.symbolColor = LightenDarkenColor( c[color], -80 );
		} else {
			pathStyle.color = c[color];
			if( color == "black" ) { pathStyle.symbolColor = LightenDarkenColor( c[color], 120 ); }
			else if( color == "green" ) { pathStyle.symbolColor = LightenDarkenColor( c[color], -80 ); }
			else { pathStyle.symbolColor = LightenDarkenColor( c[color], -40 ); }
		}

		pathPolyline = L.polyline( paths, { pane: "paths" + pathAttribs.group, color: pathStyle.color, weight: pathStyle.weight, dashArray: pathStyle.stroke, interactive: false } );
		pathPolyline.addTo( layerGroup );

		// add textpath symbol if specified
		if( pathAttribs.symbol.length ) {
			pathPolyline.setText( null );
			pathPolyline.setText( "    " + pathStyle.symbol + "    ", { repeat: true, pane: "paths" + pathAttribs.group, attributes: { "font-size": pathStyle.symbolSize, fill: pathStyle.symbolColor, dy: pathStyle.symbolDy } } );
		}
	}
}

// layer construction: layer xml extractor to layer object constructor callback
function buildLayers( layerColors, nodes, paths ) {
	var layers = new Array();
	var pathAttribs = {};

	// initialize layer array object
	for( let i = 0; i < nodes.length; i ++ ) { layers[i] = L.layerGroup(); }

	// put the layers together
	if( layers.length ) for ( let i = 0; i < layers.length; i++ ) { buildMarkers( layerColors[i+1], layers[i], nodes[i] ); };
	if( paths.length ) {
		for ( let i = 0; i < paths.length; i++ ) {
			for ( let p = 0; p < paths[i].length; p++ ) { 
				// transfer path attributes
				for( var key in paths[i][p] ) { if( key != "pathData" ) pathAttribs[key] = paths[i][p][key]; }
				pathAttribs["group"] = i;

				buildMarkers( layerColors[i+1], layers[i], paths[i][p].pathData, true, pathAttribs ); 
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

	var options = getUrlParams();
	var chapters = ( options.chapter ) ? options.chapter.split( "|" ) : [];


	// set html dom elements
	document.title = "Map of " + layerAttribs.name[0];
	document.getElementById( "map" ).style.width = mapWindowWidth + "px";
	document.getElementById( "map" ).style.height = mapWindowHeight + "px";
	
	// initialize main map
	var landmap = L.tileLayer( "", { id: "mapbox.land" } );
	var bounds = [[0, 0], [mapAssetHeight, mapAssetWidth]];
	var map = L.map( "map", {
		minZoom: mapMinZoom,
		maxZoom: mapMaxZoom,
		zoomSnap: 0.05,
		maxBounds: bounds,
		maxBoundsViscosity: 1.0,
		crs: L.CRS.Simple,
		// disabled due to leaflet-textpath using canvas incompatible svg method
		//	renderer: L.canvas(),
		layers: landmap,
		attributionControl: false
	} );
	// not yet tiling base map images in this implementation version
	var image = L.imageOverlay( mapAsset, bounds ).addTo( map );

	map.fitBounds( bounds );

	// add visible layers & fix leaflet-textpath z-index
	var panes = new Array();
	var paneZIndices = new Array();
	for ( let i = 0; i < layers.length; i++ ) {
		panes[i] = map.createPane( "paths" + i );
		if( layerAttribs.visibility[i+1] == true ) { layers[i].addTo( map ); }
		paneZIndices[i] = 400 + layers.length - i;
		panes[i].style.zIndex = paneZIndices[i];
	}

	// layer control
	var baseLayers = new Array();
	baseLayers[layerAttribs.name[0]] = landmap;

	var overlays = new Array();
	for ( let i = 0; i < layers.length; i++ ) { 
		if( !layerAttribs.chapter[i+1].length || chapters.findIndex( e => e == layerAttribs.chapter[i+1] ) > -1 ) { overlays[layerAttribs.name[i+1]] = layers[i]; }
	}

	L.control.layers( baseLayers, overlays, { collapsed: true } ).addTo( map );	

	// add graphicScale
	// see changes by Das123 @ https://gis.stackexchange.com/questions/151745/leafletjs-how-to-set-custom-map-scale-for-a-flat-image-map-crs-simple
	var unitScale = unitsAcross * mapWindowWidth / ( mapAssetWidth * mapMaxZoomMultiplier ); // x units per 1000 pixels at max zoom. Metres is default. Has's note - how many units will the map scale within its window at max zoom?, or # of units covered by window width at max zoom
	var scaleTextHtml = parse( "# " + ( ( mapNameZh.length ) ? mapNameZh + " /// " : "" ) + layerAttribs.name[0] + "\n" + unitsPerGrid + unitName + " per grid unit" );
	//	console.log( scaleTextHtml );
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
	function onMapOver( eventCoordinate ) {
		var popup = new L.Rrose( { offset: new L.Point( 0, -10 ), maxWidth: 200, closeButton: false, autoPan: false } )
			.setLatLng( eventCoordinate.latlng )
			.setContent( symFloat( "treasure-map" ) + 'You are located at ' + eventCoordinate.latlng.toString() )
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

	// cycle z-index when overlays are added
	// part of leaflet-textpath z-index fix
	window.addEventListener( "resize", onWindowResize );

	function onOverlayAdd( eventLayer ) {
		var layerToTop = layerAttribs.name.findIndex( e => e == eventLayer.name ) - 1;

		for ( let i = 0; i < layers.length; i++ ) {
			if ( paneZIndices[i] > paneZIndices[layerToTop] ) {
				panes[i].style.zIndex = --paneZIndices[i];
			}
		}
		paneZIndices[layerToTop]  = 401 + layers.length;
		panes[layerToTop].style.zIndex = paneZIndices[layerToTop];
	}

	map.on( "overlayadd", onOverlayAdd );
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

// sleep function for debugging
// use by sleep(2000).then(() => { // do something });
function sleep( ms ) {
  return new Promise( resolve => setTimeout( resolve, ms ) );
}

// init
mapDataArray();

});
