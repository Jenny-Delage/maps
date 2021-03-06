// Code by ghybs
// See https://stackoverflow.com/questions/45412056/find-leaflet-map-object-after-initialisation/45435508#45435508
// Before map(s) is(are) being initialized
var maps = [];
var layers = [];
var regions = {};
var mLinksList = {};

L.Map.addInitHook( function () {
	maps.push( this ); // Using the map array (maps) global scope variable
} );

window.addEventListener( "load", function() {
/* Layers */		
function mapDataArray() {
	var group = 0;
	var n = 0;
	var options = getUrlParams();
	var doSidebarLocations = false;
	var chapters = ( options.chapter ) ? options.chapter.toLowerCase().split( "|" ) : [];

	var fileMap = "./data/" + ( ( options.campaign ) ? options.campaign.toLowerCase() + "/" : "" ) + ( ( options.map ) ? options.map.toLowerCase() + ".xml" : "" );
	var loadXmlMapData = new XMLHttpRequest();
	loadXmlMapData.overrideMimeType( "application/xml" );
	loadXmlMapData.onreadystatechange = function() {
		if( this.readyState == 4 && this.status == 200 ) {
			var mapXml = loadXmlMapData.responseXML;

			// get layer attributes
			var layerAttribs = {
				name: [],
				type: [],
				visibility: [],
				color: [],
				chapter: []
			};
			var layerAttribsXml = mapXml.getElementsByTagName( "layer" );

			for ( var i = 0; i < layerAttribsXml.length; i++ ) {
				layerAttribs.name[i] = layerAttribsXml[i].getAttribute( "name" );
				layerAttribs.type[i] = layerAttribsXml[i].getAttribute( "type" ) ? layerAttribsXml[i].getAttribute( "type" ) : "overlay";
				layerAttribs.visibility[i] = ( layerAttribsXml[i].getAttribute( "visibility" ) == "true" );
				layerAttribs.color[i] = layerAttribsXml[i].getAttribute( "color" ) ? layerAttribsXml[i].getAttribute( "color" ) : "black";
				layerAttribs.chapter[i] = layerAttribsXml[i].getAttribute( "chapter" ) ? layerAttribsXml[i].getAttribute( "chapter" ) : "";
			}

			// get node data
			var nodes = new Array();
			var attributionXml;
			var nodeXml = mapXml.getElementsByTagName( "node" );

			if( nodeXml.length ) {
				for ( var i = 0; i < nodeXml.length; i++ ) {
					group = parseInt( nodeXml[i].getAttribute( "group" ) );
					if ( !nodes[group] ) { nodes[group] = []; n = 0; }

					if( !layerAttribs.chapter[group+1].length || chapters.findIndex( e => e == layerAttribs.chapter[group+1] ) > -1 ) {
						nodes[group][n] = {
							label: nodeXml[i].getAttribute( "label" ) ? nodeXml[i].getAttribute( "label" ) : "",
							id: nodeXml[i].getAttribute( "id" ) ? nodeXml[i].getAttribute( "id" ).replace( /[^A-za-z0-9]/g, "" ).toLowerCase() : nodeXml[i].getAttribute( "label" ).replace( /[^A-za-z0-9]/g, "" ).toLowerCase(),
							location: [parseFloat( nodeXml[i].getAttribute( "positionY" ) ), parseFloat( nodeXml[i].getAttribute( "positionX" ) )],
							shape: ( nodeXml[i].getAttribute( "shape" ) !="" && nodeXml[i].getAttribute( "shape" ) ) ? nodeXml[i].getAttribute( "shape" ) : "none",
							symbol: nodeXml[i].getAttribute( "symbol" ) ? nodeXml[i].getAttribute( "symbol" ) : "",
							color: nodeXml[i].getAttribute( "color" ) ? nodeXml[i].getAttribute( "color" ) : "",
							image: nodeXml[i].getAttribute( "image" ) ? nodeXml[i].getAttribute( "image" ) : "",
							staticLabel: ( nodeXml[i].getAttribute( "staticLabel" ) == "true" ),
							rotateLabel: nodeXml[i].getAttribute( "rotateLabel" ) ? ( -1 * parseFloat( nodeXml[i].getAttribute( "rotateLabel" ) ) ) : 0.0,
							popup: getOptionalContent( nodeXml[i], "popup" ),
							sidebar: getOptionalContent( nodeXml[i], "sidebar" ),
							footnote: getOptionalContent( nodeXml[i], "footnote" ),
							attributions: []
						};

						// see if sidebar > locations is needed
						if( nodes[group][n].sidebar.length ) { doSidebarLocations = true; }

						// populate attributions array
						attributionXml = nodeXml[i].getElementsByTagName( "attribution" );

						if( attributionXml.length ) {
							for( var p = 0; p < attributionXml.length; p++ ) {
								nodes[group][n].attributions[p] = {
									name: attributionXml[p].getAttribute( "name" ),
									url: attributionXml[p].getAttribute( "url" ) ? attributionXml[p].getAttribute( "url" ) : ""
								}
							}
						}

						n++;
					}
				}
			}

			// get path data
			var paths = new Array();
			var pathXml = mapXml.getElementsByTagName( "path" );
			group = 0;

			if( pathXml.length ) {
				for ( var i = 0; i < pathXml.length; i++ ) {
					group = parseInt( pathXml[i].getAttribute( "group" ) );
					if( !paths[group] ) { paths[group] = []; n = 0; }

					if( !layerAttribs.chapter[group+1].length || chapters.findIndex( e => e == layerAttribs.chapter[group+1] ) > -1 ) {
						paths[group][n] = { 
							route: pathXml[i].getAttribute( "route" ) ? pathXml[i].getAttribute( "route" ) : "",
							id: pathXml[i].getAttribute( "id" ) ? pathXml[i].getAttribute( "id" ).replace( /[^A-za-z0-9]/g, "" ).toLowerCase() : pathXml[i].getAttribute( "route" ).replace( /[^A-za-z0-9]/g, "" ).toLowerCase(),
							style: pathXml[i].getAttribute( "style" ) ? pathXml[i].getAttribute( "style" ) : "normal solid",
							decoration: pathXml[i].getAttribute( "decoration" ) ? pathXml[i].getAttribute( "decoration" ) : "",
							color: pathXml[i].getAttribute( "color" ) ? pathXml[i].getAttribute( "color" ) : "",
							isPolygon: ( pathXml[i].getAttribute( "isPolygon" ) == "true" ),
							polyColor: pathXml[i].getAttribute( "polyColor" ) ? pathXml[i].getAttribute( "polyColor" ) : "",
							symbol: pathXml[i].getAttribute( "symbol" ) ? pathXml[i].getAttribute( "symbol" ) : "",
							symbolSize: pathXml[i].getAttribute( "symbolSizePx" ) ? parseInt( pathXml[i].getAttribute( "symbolSizePx" ) ) : 100,
							symLocationY: parseFloat( pathXml[i].getAttribute( "symLocationY" ) ),
							symLocationX: parseFloat( pathXml[i].getAttribute( "symLocationX" ) ),
							pathData: []
						};
						paths[group][n].symbolBounds = [[paths[group][n].symLocationY - 0.5 * paths[group][n].symbolSize, paths[group][n].symLocationX - 0.5 * paths[group][n].symbolSize], [paths[group][n].symLocationY + 0.5 * paths[group][n].symbolSize, paths[group][n].symLocationX + 0.5 * paths[group][n].symbolSize]];

						var waypointXml = pathXml[i].getElementsByTagName( "waypoint" );
						// using iterative for loop because we need waypoints in order
						for ( var p = 0; p < waypointXml.length; p++ ) {
							paths[group][n].pathData[p] = {
								label: waypointXml[p].getAttribute( "label" ) ?  waypointXml[p].getAttribute( "label" ) : "",
								id: waypointXml[p].getAttribute( "id" ) ? waypointXml[p].getAttribute( "id" ).replace( /[^A-za-z0-9]/g, "" ).toLowerCase() : waypointXml[p].getAttribute( "label" ).replace( /[^A-za-z0-9]/g, "" ).toLowerCase(),
								waypoint: ( waypointXml[p].getAttribute( "waypoint" ) == "true" ),
								location: [parseFloat( waypointXml[p].getAttribute( "positionY" ) ), parseFloat( waypointXml[p].getAttribute( "positionX" ) )],
								shape: ( waypointXml[p].getAttribute( "shape" ) !="" && waypointXml[p].getAttribute( "shape" ) ) ? waypointXml[p].getAttribute( "shape" ) : "none",
								symbol: waypointXml[p].getAttribute( "symbol" ) ? waypointXml[p].getAttribute( "symbol" ) : "",
								color: waypointXml[p].getAttribute( "color" ) ? waypointXml[p].getAttribute( "color" ) : "",
								image: waypointXml[p].getAttribute( "image" ) ? waypointXml[p].getAttribute( "image" ) : "",
								staticLabel: ( waypointXml[p].getAttribute( "staticLabel" ) == "true" ),
								rotateLabel: waypointXml[p].getAttribute( "rotateLabel" ) ? ( -1 * parseFloat( waypointXml[p].getAttribute( "rotateLabel" ) ) ) : 0.0,
								popup: getOptionalContent( waypointXml[p], "popup" ),
								sidebar: getOptionalContent( waypointXml[p], "sidebar" ),
								footnote: getOptionalContent( waypointXml[p], "footnote" ),
								attributions: []
							};

							// see if sidebar > locations is needed
							if( paths[group][n].pathData[p].sidebar.length ) { doSidebarLocations = true; }

							// populate attributions array
							attributionXml = waypointXml[p].getElementsByTagName( "attribution" );

							if( attributionXml.length ) {
								for( var q = 0; q < attributionXml.length; q++ ) {
									paths[group][n].pathData[p].attributions[q] = {
										name: attributionXml[q].getAttribute( "name" ),
										url: attributionXml[q].getAttribute( "url" ) ? attributionXml[q].getAttribute( "url" ) : ""
									}
								}
							}
						}

						n++;
					}
				}
			}

			// add sidebar because we will need it to add marker onClick event
			var sidebar = buildSidebar();

			// ready to build layers & xlinks
			// the function below will fill "layers" array
			// note: layers is a global variable
			buildLayers( layerAttribs.color, sidebar, nodes, paths );

			// set sidebar content, including mlinks from mLinksList we created while building layers
			// note: mLinksList is a global variable
			setSidebarContent( doSidebarLocations );

			// get map attributes
			var mapAttribs = new Array();
			var mapAttribsXml = mapXml.getElementsByTagName( "map" );
			mapAttribs = {
				modeCartograph: ( mapAttribsXml[0].getAttribute( "modeCartograph" ) == "true" ),
				mapAsset: ( window.location.hostname == "localhost" && mapAttribsXml[0].getAttribute( "mapAssetLocal" ) ) ? mapAttribsXml[0].getAttribute( "mapAssetLocal" ) : mapAttribsXml[0].getAttribute( "mapAsset" ),
				mapAssetWidth: parseInt( mapAttribsXml[0].getAttribute( "mapAssetWidth" ) ),
				mapAssetHeight: parseInt( mapAttribsXml[0].getAttribute( "mapAssetHeight" ) ),
				mapMaxZoomMultiplier: parseFloat( mapAttribsXml[0].getAttribute( "mapMaxZoomMultiplier" ) ),
				unitName: mapAttribsXml[0].getAttribute( "unitName" ) ? mapAttribsXml[0].getAttribute( "unitName" ) : "mi",
				unitsAcross: parseFloat( mapAttribsXml[0].getAttribute( "unitsAcross" ) ),
				unitsPerGrid: parseFloat( mapAttribsXml[0].getAttribute( "unitsPerGrid" ) ),
				gridType: mapAttribsXml[0].getAttribute( "gridType" ) ? mapAttribsXml[0].getAttribute( "gridType" ) : "hex",
				gridColor: mapAttribsXml[0].getAttribute( "gridColor" ) ? mapAttribsXml[0].getAttribute( "gridColor" ) : "black",
				gridOpacity: mapAttribsXml[0].getAttribute( "gridOpacity" ) ? parseFloat( mapAttribsXml[0].getAttribute( "gridOpacity" ) ) : 0.075,
				mapAttribution:  mapAttribsXml[0].getAttribute( "mapAttribution" ) ? mapAttribsXml[0].getAttribute( "mapAttribution" ) : "",
				mapAttributionUrl:  mapAttribsXml[0].getAttribute( "mapAttributionUrl" ) ? mapAttribsXml[0].getAttribute( "mapAttributionUrl" ) : "",
				mapNameZh:  mapAttribsXml[0].getAttribute( "mapNameZh" ) ? mapAttribsXml[0].getAttribute( "mapNameZh" ) : "",
				regionBounds: [],
				regionCenter: []
			};

			if( window.location.hostname == "localhost" && mapAttribsXml[0].getAttribute( "mapAssetLocal" ) ) { console.log( "Using local basemap: " + mapAttribsXml[0].getAttribute( "mapAssetLocal" ) ); }

			// get regions and set desired region, if specified
			var region = ( options.region ) ? options.region.toLowerCase() : "";
			var regionId;
			var regionXml = mapXml.getElementsByTagName( "region" );

			if ( regionXml.length ) {
				for ( var i = 0; i < regionXml.length; i++ ) {
					// note: regions is a global variable
					var regionId = regionXml[i].getAttribute( "id" ) ? regionXml[i].getAttribute( "id" ).replace( /[^A-za-z0-9]/g, "" ).toLowerCase() : regionXml[i].getAttribute( "label" ).replace( /[^A-za-z0-9]/g, "" ).toLowerCase();
					regions[regionId] = {
						label: regionXml[i].getAttribute( "label" ),
						group: -1, // this means this region is not bound to any layer
						bounds: [[parseFloat( regionXml[i].getAttribute( "south" ) ), parseFloat( regionXml[i].getAttribute( "west" ) )], [parseFloat( regionXml[i].getAttribute( "north" ) ), parseFloat( regionXml[i].getAttribute( "east" ) )]],
						// center is presently unused because we are using flyToBounds()
						center: [parseFloat( regionXml[i].getAttribute( "north" ) ) + 0.5 * parseFloat( regionXml[i].getAttribute( "south" ) ), parseFloat( regionXml[i].getAttribute( "east" ) ) + 0.5 * parseFloat( regionXml[i].getAttribute( "west" ) )]
					}

					if( region == regionId ) {
						mapAttribs.regionBounds = regions[regionId].bounds;
						mapAttribs.regionCenter = regions[regionId].center;
					}
				}
			}

			// get labels
			var labels = {
				width: mapAttribs.mapAssetWidth,
				height: mapAttribs.mapAssetHeight,
				label: []
			};
			var labelXml = mapXml.getElementsByTagName( "label" );

			if ( labelXml.length ) {
				for ( var i = 0; i < labelXml.length; i++ ) {
					labels.label[i] = {
						text: getOptionalContent( labelXml[i], "text" ),
						positionY: mapAttribs.mapAssetHeight - parseFloat( labelXml[i].getAttribute( "positionY" ) ), 
						positionX: parseFloat( labelXml[i].getAttribute( "positionX" ) ),
						rotateLabel: labelXml[i].getAttribute( "rotateLabel" ) ? ( -1 * parseFloat( labelXml[i].getAttribute( "rotateLabel" ) ) ) : 0.0
					};
				}
			}

			// ready to build labels
			var labelAsset = buildLabelSvg( labels, mapAttribs.mapAssetWidth );

			// ready to build map
			// this function expects the "layers" array to be filled
			// note: layers is a global variable
			buildMap( mapAttribs, labelAsset, layerAttribs, sidebar );
		}
	};

	loadXmlMapData.open( "GET", fileMap, true );
	loadXmlMapData.send();
}

// inline icon svg construction
function iconDataUri( color, shape, symbol, markerObject, iconCallback ) {
	let c = getColors();
	var shapeSize = shape.split( "-" )[1];
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
			popupAnchor: [0, 0], // not used by Rrose
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
			popupAnchor: [0, 0], // not used by Rrose
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
function buildMarkers( color, sidebar, layerGroup, nodeObject, isPath = false, pathAttribs = { group: 0, style: "normal solid" } ) {
	var paths = new Array();
	var c = getColors();
	var oColor;
	// set up path specific override 
	var pColor = pathAttribs.color ? pathAttribs.color : color;
	var r = { south: 0, west: 0, north: 0, east: 0 };

	if( nodeObject.length ) {
		var marker;
		var rRose = new Array();
		/* Icon initialization */
		var iconNone = L.icon( {
			iconUrl: 'images/ffffff-0.png',
			iconSize: [24,24],
			iconAnchor: [12, 12],
			tooltipAnchor: [0, -30]
		} );

		for ( var i = 0; i < nodeObject.length; i++ ) {
			// set up node or waypoint specific override 
			oColor = nodeObject[i].color.length ? nodeObject[i].color : color;

			// choose between interactive or non interactive marker
			if( nodeObject[i].shape == "none" || ( nodeObject[i].staticLabel == true && !nodeObject[i].popup.length && !nodeObject[i].sidebar.length ) ) {
				marker = L.marker( nodeObject[i].location, { icon: iconNone, interactive: false } ).addTo( layerGroup ); 
			} else {
				marker = L.marker( nodeObject[i].location, { icon: iconNone } ).addTo( layerGroup ); 
			}

			// add mlink
			if( ( nodeObject[i].staticLabel == true || nodeObject[i].popup.length || nodeObject[i].sidebar.length ) && nodeObject[i].id.length ) {
				marker.options.mLink = {
					label: nodeObject[i].label,
					id: nodeObject[i].id
				};
			}

			// assemble polyline for connected waypoints in a path
			if( isPath == true && nodeObject[i].waypoint == true ) { 
				paths.push( nodeObject[i].location );

				// determine extremities of polygon, only if it has a symbol (thus qualifying as a region)
				if( pathAttribs.isPolygon == true && pathAttribs.symbol.length ) {
					if( nodeObject[i].location[0] < r.south || i == 0 ) { r.south = nodeObject[i].location[0]; }
					if( nodeObject[i].location[1] < r.west || i == 0 ) { r.west = nodeObject[i].location[1]; }
					if( nodeObject[i].location[0] > r.north ) { r.north = nodeObject[i].location[0]; }
					if( nodeObject[i].location[1] > r.east ) { r.east = nodeObject[i].location[1]; }
				}
			}

			if( nodeObject[i].shape != "none" )
			{
				// build marker icon
				// use node or waypoint specific override oColor
				iconDataUri( oColor, nodeObject[i].shape, nodeObject[i].symbol, marker, buildIcon );

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
				
				// add a sidebar event if relevant
				if( nodeObject[i].sidebar.length ) {
					marker.options.sidebar = {
						label: nodeObject[i].label,
						symbol: nodeObject[i].symbol,
						image: nodeObject[i].image,
						text: nodeObject[i].sidebar,
						attributions: nodeObject[i].attributions
					};
				}

				marker.on( "click", function( event ) {
					if( this.options.sidebar ) {
						setSidebarInfo( true, this.options.sidebar );
						sidebar.open( "info" );
					} else {
						// don't close sidebar if mlinks is open
						if( L.DomUtil.hasClass( L.DomUtil.get( "info" ), "active" ) ) { sidebar.close(); }
						setSidebarInfo();
					}
				} );
			}

			// create label
			if( nodeObject[i].label.length ) {
				if( nodeObject[i].staticLabel == true ) {
					// additional option to rotate label if static
					marker.bindTooltip( '<div style="transform:rotate(' + ( -1 * nodeObject[i].rotateLabel ) + 'deg);-webkit-transform:rotate(' + nodeObject[i].rotateLabel + 'deg);-moz-transform:rotate(' + nodeObject[i].rotateLabel + 'deg);">' + parse( nodeObject[i].label ) + '</div>', { permanent: true, pane: "permanentTooltips", offset: [0, -36], opacity: 1.0, direction: "center", className: "leaflet-tooltip-static" } );
				} else if ( nodeObject[i].shape != "none" ) {
					// no parse() for tooltip label. I don't expect line feeds for such labels!
					marker.bindTooltip( nodeObject[i].label + '<div style="margin-bottom:-4px;font-size:0;"</div>&nbsp;</div>' ); // contains css fix for font size change
				}
			}
		}
	}

	// build crest for polygon if needed
	// use path specific override pColor
	if( isPath == true && pathAttribs.isPolygon == true && pathAttribs.symbol.length ) {
		crestSvg( pColor, pathAttribs.symbol, layerGroup, pathAttribs.symbolSize, pathAttribs.symbolBounds, addCrest );
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
			case "dotted": pathStyle.stroke = 2 * pathStyle.weight / 3 + " " + 8 * pathStyle.weight / 3; break;
			case "dashed": pathStyle.stroke = 6 * pathStyle.weight / 2 + " " + 5 * pathStyle.weight / 2; break;
		}
		pathStyle.decorationSize = "24px";
		pathStyle.decorationDy = 8;
		switch( pathAttribs.decoration ) {
			case "arrow": pathStyle.decoration = "\u27A4"; break; // instead of \u276F
			case "circle": pathStyle.decoration = "\u25CF"; break;
			case "fisheye": pathStyle.decoration = "\u25C9"; break;
			case "star": pathStyle.decoration = "\u2737"; break;
			case "cross": pathStyle.decoration = "\u271A"; break;
			case "x-mark": pathStyle.decoration = "\u2A2F"; break;
			case "asterisk": pathStyle.decoration = "\u2731"; break;
			case "spike": pathStyle.decoration = "\u25b2"; pathStyle.decorationDy = -8; break;
		}

		// use path specific override pColor
		if( pColor == "grey" || pColor == "redLight" || pColor == "goldLight" || pColor == "blueLight" || pColor == "greenLight" || pColor == "purpleLight" || pColor == "brownLight" )
		{
			pathStyle.color = LightenDarkenColor( c[pColor], -40 );
			pathStyle.decorationColor = LightenDarkenColor( c[pColor], -80 );
		} else {
			pathStyle.color = c[pColor];
			if( pColor == "black" ) { pathStyle.decorationColor = LightenDarkenColor( c[pColor], 120 ); }
			else if( pColor == "green" ) { pathStyle.decorationColor = LightenDarkenColor( c[pColor], -80 ); }
			else { pathStyle.decorationColor = LightenDarkenColor( c[pColor], -40 ); }
		}

		if( pathAttribs.isPolygon == true ) {
			pathPolyline = L.polygon( paths, { pane: "polygons", color: pathStyle.color, opacity: 0.7, weight: pathStyle.weight, dashArray: pathStyle.stroke, fill: true, fillColor: c[pathAttribs.polyColor], fillOpacity: 0.5, interactive: false } );
			pathPolyline.addTo( layerGroup );

			// add a region, if the polygon qualifies as one
			if( pathAttribs.symbol.length && pathAttribs.id.length ) {
				// note: regions is a global variable
				regions[pathAttribs.id] = {
					label: pathAttribs.route,
					group: pathAttribs.group,
					bounds: [[r.south, r.west], [r.north, r.east]],
					// center is presently unused because we are using flyToBounds()
					center: [r.north + 0.5 * r.south, r.east + 0.5 * r.west]
				};
			}
		} else {
			pathPolyline = L.polyline( paths, { pane: "paths" + pathAttribs.group, color: pathStyle.color, opacity: 0.9, weight: pathStyle.weight, dashArray: pathStyle.stroke, interactive: false } );
			pathPolyline.addTo( layerGroup );
		}
		// add textpath decoration if specified
		if( pathAttribs.decoration.length ) {
			pathPolyline.setText( null );
			pathPolyline.setText( "    " + pathStyle.decoration + "    ", { repeat: true, pane: ( ( pathAttribs.isPolygon ) ? "polygons" : "paths" + pathAttribs.group ), attributes: { "font-size": pathStyle.decorationSize, fill: pathStyle.decorationColor, "fill-opacity": 0.9, dy: pathStyle.decorationDy } } );
		}
	}
}

function crestSvg( color, symbol, layerGroup, size, bounds, crestCallback ) {
	let c = getColors();

	var fileSymbol = "./images/symbols/" + symbol + ".svg";
	var loadXmlSymbol =  new XMLHttpRequest();
	loadXmlSymbol.onreadystatechange = function() {
		if( this.readyState == 4 &&  this.status == 200 ) {
			var symbolSvg = loadXmlSymbol.responseXML.getElementsByTagName("svg")[0];
			symbolSvg.setAttribute( "width", size + "px" );
			symbolSvg.setAttribute( "height", size + "px" );
			var svgPaths = symbolSvg.getElementsByTagName( "path" );
			if( svgPaths ) {
				for( var i = 0; i < svgPaths.length; i++ ) {
					svgPaths[i].setAttribute( "fill", c[color] );
					svgPaths[i].setAttribute( "opacity", "0.8" );
				}
			}

			crestCallback( symbolSvg, bounds, layerGroup );
		} else {
			// do nothing
		}
	}
	loadXmlSymbol.open( "GET", fileSymbol, true );
	loadXmlSymbol.send();
}

function addCrest( symbolSvg, bounds, layerGroup ) {
		var svg = L.svgOverlay( symbolSvg, bounds, { pane: "polygons", interactive: false, opacity: 1 } ).addTo( layerGroup );
}

function buildLabelSvg( labels, mapAssetWidth ) {
	var svgElement = document.createElementNS( "http://www.w3.org/2000/svg", "svg" );
	svgElement.setAttribute( "xmlns", "http://www.w3.org/2000/svg" );
	svgElement.setAttribute( "viewBox", "0 0 " + labels.width + " " + labels.height );
	svgElement.setAttribute( "width", labels.width );
	svgElement.setAttribute( "height", labels.height );
	svgElement.innerHTML = '<defs>' +
		'<style>' +
		'@import url("https://fonts.googleapis.com/css?family=Noto+Sans+SC|Noto+Sans+TC|Reem+Kufi");' +
		'.all { font-family: "Reem Kufi", sans-serif; font-size: 15px; fill: black; text-shadow: -2px -2px 0 rgba(221, 221, 221, 0.5), 2px -2px 0 rgba(221, 221, 221, 0.5), -2px 2px 0 rgba(221, 221, 221, 0.5), 2px 2px 0 rgba(221, 221, 221, 0.5), -3px 0 0 rgba(221, 221, 221, 0.5), 3px 0 0 rgba(221, 221, 221, 0.5), 0 -3px 0 rgba(221, 221, 221, 0.5), 0 3px 0 rgba(221, 221, 221, 0.5); }'+
		'.h1 { font-size: ' + ( 28 * mapAssetWidth / 1000 ) + 'px; font-weight: bold; }' +
		'.h2 { font-size: ' + ( 20 * mapAssetWidth / 1000 ) + 'px; font-weight: bold; }' +
		'.h3 { font-size: ' + ( 16 * mapAssetWidth / 1000 ) + 'px; font-weight: bold; }' +
		'.p { font-size: ' + ( 12 * mapAssetWidth / 1000 ) + 'px; }' +
		'.lang_zhs { font-family: "Noto Sans SC", sans-serif; }' +
		'.lang_zht { font-family: "Noto Sans TC", sans-serif; }' +
		'</style>' +
		'</defs>';

	if( labels.label.length ) {
		for( var i = 0; i < labels.label.length; i++ ) {
			svgElement.innerHTML += '<text text-anchor="middle" dominant-baseline="central" x="' + labels.label[i].positionX + '" y="' + labels.label[i].positionY + '" transform="rotate(' + labels.label[i].rotateLabel + ',' + labels.label[i].positionX + ',' + labels.label[i].positionY + ')" class="all">' + svgParse( labels.label[i].text ) + '</text>';
		}
	}

	return svgElement;
}

// layer construction: layer xml extractor to layer object constructor callback
function buildLayers( layerColors, sidebar, nodes, paths ) {
	// this function will fill "layers" array
	// note: layers is a global variable
	var pathAttribs = {};

	// initialize layer array object
	// accounting for some layers possibly not having any nodes, or not having any paths
	for( var i = 0; i < nodes.length; i++ ) { if( nodes[i] ) { layers[i] = L.layerGroup(); } }
	for( var i = 0; i < paths.length; i++ ) { if( paths[i] && !layers[i] ) { layers[i] = L.layerGroup(); } }

	// put the layers together
	if( nodes.length ) {
		for ( var i = 0; i < nodes.length; i++ ) {
			if( nodes[i] ) { buildMarkers( layerColors[i+1], sidebar, layers[i], nodes[i] ); }
		}
	}

	// put the paths together
	if( paths.length ) {
		for ( var i = 0; i < paths.length; i++ ) {
			if( paths[i] ) {
				for ( var p = 0; p < paths[i].length; p++ ) { 
					// transfer path attributes
					for( var key in paths[i][p] ) {
						if( paths[i][p].hasOwnProperty( key ) ) {
							if( key != "pathData" ) { pathAttribs[key] = paths[i][p][key]; }
						}
					}
					pathAttribs["group"] = i;

					buildMarkers( layerColors[i+1], sidebar, layers[i], paths[i][p].pathData, true, pathAttribs ); 
				}
			}
		}
	}

	// populate & parse xlinks
	if( layers.length ) {
		for ( var i = 0; i < layers.length; i++ ) {
			layers[i].eachLayer( function( layer ) {
				// note: mLinksList is a global variable
				if( layer instanceof L.Marker && layer.options.mLink ) {
					mLinksList[layer.options.mLink.id] = {
						label: layer.options.mLink.label,
						group: i,
						layer: layer
					};
				}
			} );
		}
	}
}

// map construction: layer xml extractor to map object constructor callback
function buildMap( m, labelAsset, layerAttribs, sidebar ) {
// this function expects the "layers" array to be filled
// note: layers is a global variable
//	var m.mapWindowWidth = 400;
//	var m.mapWindowHeight = Math.floor( mapWindowWidth / mapAssetWidth * mapAssetHeight );
	m.mapWindowWidth = Math.min( m.mapAssetWidth * m.mapMaxZoomMultiplier, window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth );
	m.mapWindowHeight = Math.min( m.mapAssetHeight * m.mapMaxZoomMultiplier, window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight );
	m.mapMinZoom = calcMapMinZoom( m.mapWindowWidth, m.mapWindowHeight, m.mapAssetWidth, m.mapAssetHeight, m.mapMaxZoomMultiplier );
	m.mapMaxZoom = Math.log10( m.mapMaxZoomMultiplier ) / Math.log10 ( 2 );

	// set html dom elements
	document.title = "Map of " + layerAttribs.name[0];
	document.getElementById( "map" ).style.width = m.mapWindowWidth + "px";
	document.getElementById( "map" ).style.height = m.mapWindowHeight + "px";
	
	// initialize main map
	var landmap = L.tileLayer( "", { id: "mapbox.land" } );
	m.bounds = [[0, 0], [m.mapAssetHeight, m.mapAssetWidth]];
	var map = L.map( "map", {
		minZoom: m.mapMinZoom,
		maxZoom: m.mapMaxZoom,
		zoomSnap: 0.05,
		maxBounds: m.bounds,
		maxBoundsViscosity: 1.0,
		crs: L.CRS.Simple,
		// disabled due to leaflet-textpath using canvas incompatible svg method
		// textpaths will throw an error if layer control removes them
		// renderer: L.canvas(),
		layers: landmap,
		attributionControl: false
	} );
	// not yet tiling base map images in this implementation version
	var image = L.imageOverlay( m.mapAsset, m.bounds ).addTo( map );
	var labelsPane = map.createPane( "labels" );
	labelsPane.style.zIndex = 402;
	var svg = L.svgOverlay( labelAsset, m.bounds, { pane: "labels", interactive: false } ).addTo( map );

	// fit map
	map.fitBounds( m.bounds );

	// do the rest only when map is ready
	map.whenReady( function() {
		// add attribution
		m.mapAttrString = '';
		var mapAttr = L.control.attribution( { prefix: true } ).setPosition( "bottomleft" ).setPrefix("");

		if( m.mapWindowWidth > 850 ) { mapAttr.setPrefix( "" ); }
		else { mapAttr.setPrefix( m.unitsPerGrid + m.unitName + " per grid unit" ) };

		if( m.mapAttribution.length ) {
			m.mapAttrString += 'Map by ';
			if( m.mapAttributionUrl.length ) { m.mapAttrString += '<a href ="' + m.mapAttributionUrl + '" target="_blank">'; }
			m.mapAttrString += m.mapAttribution;
			if( m.mapAttributionUrl.length ) { m.mapAttrString += '</a>'; }
		}
		mapAttr.addAttribution( m.mapAttrString );

		if( m.mapWindowWidth <= 850 || m.mapAttribution.length ) { mapAttr.addTo( map ); }

		// override visibility if specified in Url
		var options = getUrlParams();

		if( options.show ) {
			for( var i = 0; i < layerAttribs.visibility.length; i++ ) {
				if ( options.show.toLowerCase().charAt( i ) ) {
					layerAttribs.visibility[i+1] = ( options.show.toLowerCase().charAt( i ) == "o" ) ? false : true;
				}
			}
		}

		// add visible layers & fix leaflet-textpath z-index
		var panes = new Array();
		var paneZIndices = new Array();

		var polygonsPane = map.createPane( "polygons" );
		polygonsPane.style.zIndex = 401;
		var permanentTooltipsPane = map.createPane( "permanentTooltips" );
		permanentTooltipsPane.style.zIndex = 499;

		// note: layers is a global variable
		for ( var i = 0; i < layers.length; i++ ) {
			panes[i] = map.createPane( "paths" + i );
			if( layerAttribs.visibility[i+1] == true ) { layers[i].addTo( map ); }
			paneZIndices[i] = 402 + layers.length - i;
			panes[i].style.zIndex = paneZIndices[i];
		}

		// layer control
		// note: layers is a global variable
		var baseLayers = new Array();
		var overlays = new Array();
		var chapters = ( options.chapter ) ? options.chapter.toLowerCase().split( "|" ) : [];
		baseLayers[layerAttribs.name[0]] = landmap;

		for ( var i = 0; i < layers.length; i++ ) { 
			if( !layerAttribs.chapter[i+1].length || chapters.findIndex( e => e == layerAttribs.chapter[i+1] ) > -1 ) { overlays[layerAttribs.name[i+1]] = layers[i]; }
		}

		L.control.layers( baseLayers, overlays, { collapsed: true, hideSingleBase: true } ).addTo( map );

		// add graphicScale
		// see changes by Das123 @ https://gis.stackexchange.com/questions/151745/leafletjs-how-to-set-custom-map-scale-for-a-flat-image-map-crs-simple
		m.unitScale = m.unitsAcross * m.mapWindowWidth / ( m.mapAssetWidth * m.mapMaxZoomMultiplier ); // x units per 1000 pixels at max zoom. Metres is default. Has's note - how many units will the map scale within its window at max zoom?, or # of units covered by window width at max zoom
		m.scaleTextHtml = parse( "# " + ( ( m.mapNameZh.length ) ? m.mapNameZh + " /// " : "" ) + layerAttribs.name[0] + "\n" + m.unitsPerGrid + m.unitName + " per grid unit" );
		var graphicScale = new L.control.graphicScale( {
			doubleLine: true,
			fill: "hollow",
			showSubunits: true,
			minUnitWidth: Math.min( 80, m.mapWindowWidth * 0.1 ), // recommended 30
			maxUnitsWidth: Math.min( 300, m.mapWindowWidth * 0.5 ), // recommended 240
			unitsPer1000px: m.unitScale, // x units per 1000 pixels at max zoom. Metres is default. Has's note - how many units will the map scale within its window at max zoom?, or # of units covered by window width at max zoom
			scaleUnit: m.unitName // override with your own unit designation. null is default and will revert to m / km
		} );

		if( m.mapWindowWidth > 850 ) {
			graphicScale.addTo( map );

			var scaleText = L.DomUtil.create( "div", "scaleText" );
			graphicScale._container.insertBefore( scaleText, graphicScale._container.firstChild );
			scaleText.innerHTML = m.scaleTextHtml;
		}

		// add hex or square grid
		loadTurfGrid( map, m.mapAssetWidth, m.mapAssetHeight, m.unitsAcross, m.unitsPerGrid, m.gridType, m.gridColor, m.gridOpacity );

		// add sidebar and map onClick event
		setSidebarInfo();
		sidebar.addTo( map );
		map.on( "click", function( e ) {
			sidebar.close();
			setSidebarInfo();

			if ( m.modeCartograph == true ) {
				var clipText = 'positionY="' + Math.round( ( e.latlng.lat + Number.EPSILON ) * 100 ) / 100 + '" positionX="' + Math.round( ( e.latlng.lng + Number.EPSILON ) * 100 ) / 100 + '"';
				
				navigator.clipboard.writeText( clipText ).then( function( ) {
					console.log( "Copied:" + clipText.replace( /position/g, "" ) );
				}, function( err ) {
					console.error( "Copy unsuccessful: ", err );
				});
			}
		} );

		// zoom and pan to location or region. Note that location takes preference if both are specified.
		// this must be done after sidebar is initialized, so that we can close sidebar if a marker with a popup is specified as desired location
		//	map.flyTo( regionCenter, calcMapPanZoom( mapWindowWidth, mapWindowHeight, regionWidth, regionHeight, mapMaxZoomMultiplier ) );
		// flyToBounds() is much nicer
		var location;

		if( options.location ) {
			location = options.location.replace( /[^A-za-z0-9]/g, "" ).toLowerCase();
			if( mLinksList[location] ) {
				if( !map.hasLayer( layers[mLinksList[location].group] ) ) { map.addLayer( layers[mLinksList[location].group] ); }
				map.flyTo( mLinksList[location].layer.getLatLng(), m.mapMaxZoom, { animate: true } );
				mLinksList[location].layer.fire( "click" );
			}
		} else if( m.regionBounds.length ) {
			map.whenReady( function () {
				map.flyToBounds( m.regionBounds, { maxZoom: m.mapMaxZoom } );
			} );
		}

		// popup to give coordinates
		function onMapOver( eventCoordinate ) {
			var popup = new L.Rrose( { offset: new L.Point( 0, -10 ), maxWidth: 200, closeButton: false, autoPan: false } )
				.setLatLng( eventCoordinate.latlng )
				.setContent( symFloat( "treasure-map" ) + 'You are located at ' + eventCoordinate.latlng.toString() )
				.openOn( map );
		}

		if ( m.modeCartograph == true ) {
			map.on( "mouseover mousemove", onMapOver );
			map.on( "mouseout", function( event ){ map.closePopup(); } );
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
			var widthNew = Math.min( m.mapAssetWidth * m.mapMaxZoomMultiplier, ( window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth ) );
			var heightNew = Math.min( m.mapAssetHeight * m.mapMaxZoomMultiplier, ( window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight ) );
			var boundsNew = [[0, 0], [heightNew, widthNew]];
			var minZoomNew = calcMapMinZoom( widthNew, heightNew, m.mapAssetWidth, m.mapAssetHeight, m.mapMaxZoomMultiplier );
			var unitScaleNew = m.unitsAcross * widthNew / ( m.mapAssetWidth * m.mapMaxZoomMultiplier );
			
			// set new window width and minZoom
			map.setMinZoom( minZoomNew );
			document.getElementById( "map" ).style.width = widthNew + "px";
			document.getElementById( "map" ).style.height = heightNew + "px";
			
			// adjust current zoom level
			if( zoomOld < minZoomNew ) { map.setZoom( minZoomNew ); }
			
			// repaint
			map.invalidateSize();
			
			// fix attribution
			mapAttr.remove();
			if( widthNew > 850 ) { mapAttr.setPrefix( "" ); }
			else { mapAttr.setPrefix( m.unitsPerGrid + m.unitName + " per grid unit" ); }
			if( widthNew <= 850 || m.mapAttribution.length ) { mapAttr.addTo( map ); }

			// fix scale
			graphicScale.remove();
			if( widthNew > 850 ) {
				graphicScale.options.minUnitWidth = Math.min( 80, widthNew * 0.1 );
				graphicScale.options.maxUnitsWidth = Math.min( 300, widthNew * 0.5 );
				graphicScale.options.unitsPer1000px = unitScaleNew;
				graphicScale.addTo( map );
				var scaleText = L.DomUtil.create( "div", "scaleText" );
				graphicScale._container.insertBefore( scaleText, graphicScale._container.firstChild );
				scaleText.innerHTML = m.scaleTextHtml;
			}
		};

		// cycle z-index when overlays are added
		// part of leaflet-textpath z-index fix
		window.addEventListener( "resize", onWindowResize );

		function onOverlayAdd( eventLayer ) {
			var layerToTop = layerAttribs.name.findIndex( e => e == eventLayer.name ) - 1;

			// using iterative for loop because we need layers in order
			// note: layers is a global variable
			for ( var i = 0; i < layers.length; i++ ) {
				if ( paneZIndices[i] > paneZIndices[layerToTop] ) {
					panes[i].style.zIndex = --paneZIndices[i];
				}
			}
			paneZIndices[layerToTop]  = 402 + layers.length;
			panes[layerToTop].style.zIndex = paneZIndices[layerToTop];
		}

		map.on( "overlayadd", onOverlayAdd );
	} );
}

// hex grid
function loadTurfGrid( map, mapAssetWidth, mapAssetHeight, unitsAcross, unitsPerGrid, gridType, gridColor, gridOpacity ) {
	var c = getColors();
	var gridCellSide = mapAssetWidth * unitsPerGrid / unitsAcross / 2;
//	var bbox = [-2 * gridCellSide, -2 * gridCellSide, mapAssetWidth + 2 * gridCellSide, mapAssetHeight + 2 * gridCellSide];
	var bbox = [0, 0, mapAssetWidth + 2 * gridCellSide, mapAssetHeight + 2 * gridCellSide];
	var geojson = ( gridType == "hex" ) ? turf.hexGrid( bbox, gridCellSide, { options: { units: "miles" } } ) : turf.squareGrid( bbox, gridCellSide, { options: { units: "miles" } } );

	var gridLayer = L.geoJson( geojson, {
		style: {
			weight: 3,
			fillOpacity: 0,
			color: c[gridColor],
			opacity: gridOpacity,
			interactive: false
		}
	} );

	map.addLayer( gridLayer );
}

// create sidebar object
function buildSidebar() {
	var sidebar = L.control.sidebar( {
		autopan: false, 			// whether to maintain the centered map point when opening the sidebar
		closeButton: true, 		// whether to add a close button to the panes
		container: "sidebar",	// the DOM container or #ID of a predefined sidebar container that should be used
		position: "right"			// left or right
	} );

	return sidebar;
}

function setSidebarContent( doSidebarLocations ) {
	var options = getUrlParams();

	// set info icon
	document.getElementById( "info_button" ).innerHTML = '<img src="./images/symbols/book-cover.svg">';
	if( doSidebarLocations ) {
		document.getElementById( "info_tab" ).style = ""; // make info tab visible
	}

	// get data from campaign xml
	var fileCampaign = "./data/" + ( ( options.campaign ) ? options.campaign.toLowerCase() + "/" : "" ) + "_" + ( ( options.campaign ) ? options.campaign.toLowerCase() + ".xml" : "" );
	var loadXmlCampaignData = new XMLHttpRequest();
	loadXmlCampaignData.overrideMimeType( "application/xml" );
	loadXmlCampaignData.onreadystatechange = function() {
		if( this.readyState == 4 && this.status == 200 ) {
			var campaignXml = loadXmlCampaignData.responseXML;

			// add campaign info to sidebar
			var campaignAttribs = new Array();
			var campaign = document.getElementById( "campaign_content" );
			var campaignAttribsXml = campaignXml.getElementsByTagName( "campaign" );

			campaignAttribs = {
				name: ( campaignAttribsXml[0].getAttribute( "name" ) ) ? campaignAttribsXml[0].getAttribute( "name" ) : "",
				subtitle: ( campaignAttribsXml[0].getAttribute( "subtitle" ) ) ? campaignAttribsXml[0].getAttribute( "subtitle" ) : "",
				symbol: ( campaignAttribsXml[0].getAttribute( "symbol" ) ) ? campaignAttribsXml[0].getAttribute( "symbol" ) : "ra-helmet",
				image: ( campaignAttribsXml[0].getAttribute( "image" ) ) ? campaignAttribsXml[0].getAttribute( "image" ) : "",
				description: getOptionalContent( campaignAttribsXml[0], "description" ),
				attributions: [],
				xMaps: {
					world: [],
					region: [],
					city: [],
					dungeon: []
				},
				xLinks: []
			};

			var attributionXml = campaignAttribsXml[0].getElementsByTagName( "attribution" );

			if( attributionXml.length ) {
				for( var i = 0; i < attributionXml.length; i++ ) {
					campaignAttribs.attributions[i] = {
						name: attributionXml[i].getAttribute( "name" ),
						url: ( attributionXml[i].getAttribute( "url" ) ) ? attributionXml[i].getAttribute( "url" ) : ""
					}
				}
			}

			var attribution = '';
			campaign.innerHTML = '';

			if( campaignAttribs ) {
				// set icon and reveal campaign tab
				document.getElementById( "campaign_button" ).innerHTML = '<img src="./images/symbols/' + campaignAttribs.symbol + '.svg">';
				document.getElementById( "campaign_tab" ).style = ""; // make campaign tab visible

				// add campaign content
				if( campaignAttribs.image.length ) { 
					campaign.innerHTML += '<img src="' + campaignAttribs.image + '">';
				} else {
					campaign.innerHTML += sidebarSpacer();
				}

				if( campaignAttribs.name.length ) { campaign.innerHTML += "<h1>" + campaignAttribs.name + "</h1>"; }

				if( campaignAttribs.subtitle.length ) { campaign.innerHTML += "<h2>" + campaignAttribs.subtitle + "</h2>"; }

				if( campaignAttribs.attributions.length ) { 
					for( var i = 0; i < campaignAttribs.attributions.length; i++ ) {
						if( i > 0 ) { attribution += ", "; }
						if( campaignAttribs.attributions[i].url.length ) { attribution += '<a href="' + campaignAttribs.attributions[i].url + '" target="_blank">'; }
						attribution += campaignAttribs.attributions[i].name;
						if( campaignAttribs.attributions[i].url.length ) { attribution += '</a>'; }
					}
					campaign.innerHTML += '<p style="font-size: 0.8em; font-variant: small-caps; opacity: 0.8;">Artwork by ' + attribution + '</p>';
				}

				campaign.innerHTML += parse( campaignAttribs.description );
			}

			// build xlinks on sidebar
			var xLinksXml = campaignXml.getElementsByTagName( "xlink" );

			if ( xLinksXml.length ) {
				for ( var i = 0; i < xLinksXml.length; i++ ) {
					campaignAttribs.xLinks[i] = {
						type: ( xLinksXml[i].getAttribute( "type" ) ) ? xLinksXml[i].getAttribute( "type" ) : "",
						url: ( xLinksXml[i].getAttribute( "url" ) ) ? xLinksXml[i].getAttribute( "url" ) : ""
					}
				}
			}

			for( var i = 0; i < campaignAttribs.xLinks.length; i++ ) {
				switch( campaignAttribs.xLinks[i].type ) {
					case "wiki":
						document.getElementById( "xlink_wiki" ).innerHTML = '<a href="' + campaignAttribs.xLinks[i].url + '" target="_blank"><img src="./images/wikipedia-w.svg"></a>';
						document.getElementById( "xlink_wiki" ).style = "";
						break;
					case "roll20":
						document.getElementById( "xlink_roll20" ).innerHTML = '<a href="' + campaignAttribs.xLinks[i].url + '" target="_blank"><img src="./images/symbols/dice-d20.svg"></a>';
						document.getElementById( "xlink_roll20" ).style = "";
						break;
					case "ddb":
						document.getElementById( "xlink_ddb" ).innerHTML = '<a href="' + campaignAttribs.xLinks[i].url + '" target="_blank"><img src="./images/d-and-d.svg"></a>';
						document.getElementById( "xlink_ddb" ).style = "";
						break;
					case "discord":
						document.getElementById( "xlink_discord" ).innerHTML = '<a href="' + campaignAttribs.xLinks[i].url + '" target="_blank"><img src="./images/discord.svg"></a>';
						document.getElementById( "xlink_discord" ).style = "";
						break;
					case "gdrive":
						document.getElementById( "xlink_gdrive" ).innerHTML = '<a href="' + campaignAttribs.xLinks[i].url + '" target="_blank"><img src="./images/google-drive.svg"></a>';
						document.getElementById( "xlink_gdrive" ).style = "";
						break;
				}
			}

			// add linklist to other campaign maps on sidebar
			if( campaignXml.getElementsByTagName( "xmaps" ).length ) {
				var xMaps = document.getElementById( "xmaps_content" );
				var xMapType;
				var xMapTypes = {
					world: "World",
					city: "Cities",
					locality: "Localities",
					dungeon: "Dungeons"
				}
				var xMapLink;
				var xMapsImageDefault = "https://i.imgur.com/2QuZiMg.jpg";
				var xMapsImage = ( campaignXml.getElementsByTagName( "xmaps" )[0].getAttribute( "image" ) ) ? campaignXml.getElementsByTagName( "xmaps" )[0].getAttribute( "image" ) : xMapsImageDefault;
				var xMapsAttribution;
				var xMapsAttributionUrl;

				if( xMapsImage == xMapsImageDefault ) {
					xMapsAttribution = "Alex Pushilin";
					xMapsAttributionUrl = "https://www.behance.net/plannit";
				} else {
					xMapsAttribution = ( campaignXml.getElementsByTagName( "xmaps" )[0].getAttribute( "imageAttribution" ) ) ? campaignXml.getElementsByTagName( "xmaps" )[0].getAttribute( "imageAttribution" ) : "";
					xMapsAttributionUrl = ( campaignXml.getElementsByTagName( "xmaps" )[0].getAttribute( "xMapsAttributionUrl" ) ) ? campaignXml.getElementsByTagName( "xmaps" )[0].getAttribute( "xMapsAttributionUrl" ) : "";
				}

				xMaps.innerHTML = '';
				var xMapsXml = campaignXml.getElementsByTagName( "xmap" );

				if ( xMapsXml.length ) {
					document.getElementById( "xmaps_button" ).innerHTML = '<img src="./images/symbols/compass.svg">';
					document.getElementById( "xmaps_tab" ).style = ""; // make xmaps tab visible
					xMaps.innerHTML += '<img src="' + xMapsImage + '">';
					xMaps.innerHTML += '<p style="font-size: 0.8em; font-variant: small-caps; opacity: 0.8;">Artwork by <a href="' + xMapsAttributionUrl + '" target="_blank">' + xMapsAttribution + '</a></p>';

					for ( var i = 0; i < xMapsXml.length; i++ ) {
						xMapType = ( xMapsXml[i].getAttribute( "type" ) ) ? xMapsXml[i].getAttribute( "type" ) : "city";
						if( !campaignAttribs.xMaps[xMapType] ) { campaignAttribs.xMaps[xMapType] = []; }

						campaignAttribs.xMaps[xMapType].push( {
							name: ( xMapsXml[i].getAttribute( "name" ) ) ? xMapsXml[i].getAttribute( "name" ) : "",
							url: ( xMapsXml[i].getAttribute( "url" ) ) ? xMapsXml[i].getAttribute( "url" ) : ""
						} );
					}
				}

				for ( var type in campaignAttribs.xMaps ) {
					if ( campaignAttribs.xMaps.hasOwnProperty( type ) && campaignAttribs.xMaps[type].length ) {
						xMapLink = '';
						xMapLink += '<h1>' + xMapTypes[type] + '</h1><ul>';
						for( var i = 0; i < campaignAttribs.xMaps[type].length; i++ ) {
							xMapLink += '<li><a href="' + window.location.href.split('?')[0] + '?campaign=' + options.campaign.toLowerCase() + '&map=' + campaignAttribs.xMaps[type][i].url + '" target="_blank">' + campaignAttribs.xMaps[type][i].name + '</a></li>';
						}
						xMapLink += '</ul>'
						xMaps.innerHTML += xMapLink;
					}
				}
			}

			// add linklist to locations in the map
			if( Object.keys( regions ).length || Object.keys( mLinksList ).length ) {
				document.getElementById( "mlinks_button" ).innerHTML = '<img src="./images/symbols/map-signs.svg">';
				document.getElementById( "mlinks_tab" ).style = ""; // make mlinks tab visible

				var mLinks = document.getElementById( "mlinks_content" );
				var mLinksImageDefault = "https://i.imgur.com/fN8ytdK.jpg";
				var mLinksImage;
				var mLinksItems = '';
				if( campaignXml.getElementsByTagName( "mlinks" ).length ) {
					mLinksImage = ( campaignXml.getElementsByTagName( "mlinks" )[0].getAttribute( "image" ) ) ? campaignXml.getElementsByTagName( "mlinks" )[0].getAttribute( "image" ) : mLinksImageDefault;
				} else {
					mLinksImage = mLinksImageDefault;
				}
				var mLinksAttribution;
				var mLinksAttributionUrl;

				if( mLinksImage == mLinksImageDefault ) {
					mLinksAttribution = "Sylvain Sarrailh";
					mLinksAttributionUrl = "https://www.artstation.com/tohad";
				} else {
					mLinksAttribution = ( campaignXml.getElementsByTagName( "mlinks" )[0].getAttribute( "imageAttribution" ) ) ? campaignXml.getElementsByTagName( "mlinks" )[0].getAttribute( "imageAttribution" ) : "";
					mLinksAttributionUrl = ( campaignXml.getElementsByTagName( "mlinks" )[0].getAttribute( "xMapsAttributionUrl" ) ) ? campaignXml.getElementsByTagName( "mlinks" )[0].getAttribute( "xMapsAttributionUrl" ) : "";
				}

				mLinks.innerHTML = '';
				mLinks.innerHTML += '<img src="' + mLinksImage + '">';
				mLinks.innerHTML += '<p style="font-size: 0.8em; font-variant: small-caps; opacity: 0.8;">Artwork by <a href="' + mLinksAttributionUrl + '" target="_blank">' + mLinksAttribution + '</a></p>';

				// add regions
				if( Object.keys( regions ).length ) {
					mLinksItems += '<h1>Regions</h1><ul>';
					// note: regions is a global variable
					Object.keys( regions )
						.sort()
						.forEach( function( v, i ) {
							mLinksItems += '<li><a href="#" onclick="mLinkFire( \'region\', \'' + v + '\' );">' + regions[v].label + '</a></li>';
						} );
					mLinksItems += '</ul>'
				}

				// add locations
				if( Object.keys( mLinksList ).length ) {
					mLinksItems += '<h1>Locations</h1><ul>';
					// note: mLinksList is a global variable
					Object.keys( mLinksList )
						.sort()
						.forEach( function( v, i ) {
							mLinksItems += '<li><a href="#" onclick="mLinkFire( \'location\', \'' + v + '\' );">' + mLinksList[v].label + '</a></li>';
						} );
					mLinksItems += '</ul>'
					mLinks.innerHTML += mLinksItems;
				}
			}
		}
	};
	loadXmlCampaignData.open( "GET", fileCampaign, true );
	loadXmlCampaignData.send();
}

function setSidebarInfo( click = false, sidebarData ) {
	var attribution = '';
	var info = document.getElementById( "info_content" );

	info.innerHTML = '';
	if( click ) {
		if( sidebarData.image.length ) { 
			info.innerHTML += '<img src="' + sidebarData.image + '">';
		} else {
			info.innerHTML += sidebarSpacer();
		}

		if( sidebarData.label.length ) { 
			if( sidebarData.symbol.length ) { info.innerHTML += symFloat( sidebarData.symbol, true ); }
			info.innerHTML += '<h1' + ( ( sidebarData.symbol.length ) ? " style=padding-left:8px;" : "" ) + '>' + sidebarData.label + '</h1>';
		}

		if( sidebarData.attributions.length ) { 
			for( var i = 0; i < sidebarData.attributions.length; i++ ) {
				if( i > 0 ) { attribution += ", "; }
				if( sidebarData.attributions[i].url.length ) { attribution += '<a href="' + sidebarData.attributions[i].url + '" target="_blank">'; }
				attribution += sidebarData.attributions[i].name;
				if( sidebarData.attributions[i].url.length ) { attribution += '</a>'; }
			}
			info.innerHTML += '<p style="font-size: 0.8em; font-variant: small-caps; opacity: 0.8;">Artwork by ' + attribution + '</p>';
		}
		info.innerHTML += parse( sidebarData.text );
	} else { info.innerHTML += '<p>Click on a pin for more information.</p>'; }
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
	// no need to bound upper end as mapMaxZoom since we are setting max mapWindow dimensions to mapAsset dimensions x mapMaxZoomMultiplier
	if( ( mapAssetHeight / mapAssetWidth ) < ( mapWindowHeight / mapWindowWidth ) ) {
		return Math.log10( Math.min( mapMaxZoomMultiplier, mapWindowHeight / mapAssetHeight ) ) / Math.log10( 2 );
	}
	else {
		return Math.log10( Math.min( mapMaxZoomMultiplier, mapWindowWidth / mapAssetWidth ) ) / Math.log10( 2 );
	}
}

// unused for now since flyToBounds() is built-in
function calcMapPanZoom( mapWindowWidth, mapWindowHeight, regionWidth, regionHeight, mapMaxZoomMultiplier ) {
	// no need to bound upper end as mapMaxZoom since we are setting max mapWindow dimensions to mapAsset dimensions x 3
	if( ( regionHeight / regionWidth ) < ( mapWindowHeight / mapWindowWidth ) ) {
		return Math.log10( Math.min( mapMaxZoomMultiplier, mapWindowWidth / regionWidth ) ) / Math.log10( 2 );
	}
	else {
		return Math.log10( Math.min( mapMaxZoomMultiplier, mapWindowHeight / regionHeight ) ) / Math.log10( 2 );
	}
}

// quick style: symbol right-float
function symFloat( symbol, left = false ) { return '<img class="symFloat-' + ( ( left ) ? "left" : "right" ) + '" width="32px" height="32px" src="images/symbols/' + symbol + '.svg" alt="">'; }

// format of spacer under sidebar header if no leading image is present
function sidebarSpacer() { return '<div style="margin-top:5px;visibility:hidden;font-size:0;">&nbsp;</div>'; }

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

// Function to get style of select CSS class
function getStyle(ruleClass) {
	// example:
	// var style = getStyle( ".name-of-style" );
	// style.fontSize = 16 + "px"
	for ( var i = 0; i < document.styleSheets.length; i++ ) {
		var sheet = document.styleSheets[i];
		// not sure why author put this condition here
		//	if ( sheet.href == null ) {
			var rules = sheet.cssRules ? sheet.cssRules : sheet.rules;
						console.table( rules );
			if ( rules == null ) return null;
				for ( var p = 0; p < rules.length; p++ ) {
					if ( rules[p].selectorText == ruleClass ) {
						return rules[p].style;
					}
				}
		// }
	}
	return null;
}

// sleep function for debugging
// use by sleep(2000).then(() => { // do something });
function sleep( ms ) {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}

// init
mapDataArray();

} );

function mLinkFire( scope, target ) {
	if ( !Array.prototype.last ){
		Array.prototype.last = function() {
			return this[this.length - 1];
		};
	};

	if( scope == "location" && mLinksList[target] ) {	
		// if condition necessary only if interested in targets within viewing window
		//	if( maps.last().getBounds().contains( mLinksList[target].layer.getLatLng() ) ) {
				maps.last().whenReady( function () {
					maps.last().closePopup();
					if( !maps.last().hasLayer( layers[mLinksList[target].group] ) ) { maps.last().addLayer( layers[mLinksList[target].group] ); }
					maps.last().flyTo( mLinksList[target].layer.getLatLng(), maps.last().options.maxZoom, { animate: true } );
					mLinksList[target].layer.fire( "click" );
				} );
		//	}
	} else if( scope == "region" && regions[target] ) {
		maps.last().whenReady( function () {
			if( regions[target].group > -1 ) {
				if( !maps.last().hasLayer( layers[regions[target].group] ) ) { maps.last().addLayer( layers[regions[target].group] ); }
			}
			maps.last().flyToBounds( regions[target].bounds, { maxZoom: maps.last().options.maxZoom } );
		} );
	}
}
