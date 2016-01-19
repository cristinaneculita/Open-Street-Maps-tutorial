

var mapApp = mapApp || {};
var marker; 

(function(context) {

    var map = {};
    var markerPosition = null;
    var polylineRoute = [];
    var routeGroup = new L.FeatureGroup();
    var route = new L.FeatureGroup();

    context.init = function(lat, lng, zm, mapDivId) {
        console.log("init open street map")
        var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var osmAttrib = 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
        var osm = new L.TileLayer(osmUrl, { attribution: osmAttrib });

        map = L.map(mapDivId, { center: [lat, lng], zoom: zm });

        map.on('contextmenu', function(e) {

        })

        osm.addTo(map);

        routeGroup.addTo(map);
        route.addTo(map);

    }
    var icon1 = L.divIcon({ iconSize: [9, 9], iconAnchor: [6, 6], className: 'div-icon' });
    var icon2 = L.divIcon({ iconSize: [9, 9], iconAnchor: [6, 6], className: 'div-icon div-icon-middle' });
    var icon3 = L.divIcon({ iconSize: [9, 9], iconAnchor: [6, 6], className: 'div-icon div-icon-mouse-over' });
    var icon4 = L.divIcon({ iconSize: [9, 9], iconAnchor: [6, 6], className: 'div-icon div-icon-middle div-icon-mouse-over' });

    var lastLineMidMarker;
    var poli = [];
    var currentMarkerIndex;
    var midMarkers = [];
    var polylineRoute;
    var polyline2;
    var undoIcon = L.icon({
        iconUrl: '../../../../SAM/Modules/NSR/Images/Map/undo_simple.png',
        iconSize: [30, 27],
        iconAnchor: [-8, 13],
        draggable: true
    });
    var undoOverIcon = L.icon({
        iconUrl: '../../../../SAM/Modules/NSR/Images/Map/undo_click.png',
        iconSize: [30, 27],
        iconAnchor: [-8, 13],
        draggable: true
    });
    var options = {
        opacity: 0.6,
        color: 'red',
        weight: 5,
        fillColor: '#90A8FF',
        fillOpacity: 0.5

    };
    var undoIconMarker;
    var undoLatLng;
    var lastMarkerDragged;

    previousIndex = function(index, count) {
        return index == 0 ? count - 1 : index - 1;
    }

    nextIndex = function(index, count) {
        return index == count - 1 ? 0 : index + 1;
    }

    deleteMarker = function() {
        routeGroup.removeLayer(this);
        currentMarkerIndex = $.inArray(this._latlng, poli);
        poli.splice(currentMarkerIndex, 1);
        routeGroup.removeLayer(polylineRoute);
        polylineRoute = L.polyline(poli, options).addTo(routeGroup);

        var len = midMarkers.length;
        var polilen = poli.length;
        if (poli.length == 1) {
            routeGroup.removeLayer(midMarkers[0]);
            midMarkers.splice(0, 1);
        }
        if (poli.length > 1) {
            var removeHowMany = 0;
            if (currentMarkerIndex != 0) {
                var rightMidMarker = midMarkers[previousIndex(currentMarkerIndex, len)];
                routeGroup.removeLayer(rightMidMarker);
                removeHowMany++;
            }
            if (currentMarkerIndex != polilen) {
                var leftMidMarker = midMarkers[currentMarkerIndex];
                routeGroup.removeLayer(leftMidMarker);
                removeHowMany++;
            }

            if (currentMarkerIndex == 0)
                midMarkers.splice(0, removeHowMany);
            else {
                midMarkers.splice(currentMarkerIndex - 1, removeHowMany);
            }


        }

        if (poli.length >= 2 && currentMarkerIndex < len) {
            if (currentMarkerIndex != 0) {
                var rightPoint = poli[previousIndex(currentMarkerIndex, polilen)];
                if (currentMarkerIndex <= polilen - 1)
                    var leftPoint = poli[currentMarkerIndex];
                else {
                    var leftPoint = poli[0];
                }
                var midPoint = [
                    (rightPoint.lat + leftPoint.lat) / 2.,
                    (rightPoint.lng + leftPoint.lng) / 2.
                ];
                var newMidMarker = L.marker(midPoint, { draggable: true, icon: icon2 }).addTo(routeGroup);
                addEventsToMiddleMarkers(newMidMarker);

                midMarkers.splice(previousIndex(currentMarkerIndex, len), 0, newMidMarker);
            }

        }

        if (undoIconMarker)
            routeGroup.removeLayer(undoIconMarker);
        console.log('markers count: ' + midMarkers.length);


    }

    addEventsToMarkers = function(marker) {
        marker.on('dragstart', startDrag);
        marker.on('dragend', endDrag);
        marker.on('mouseover', mouseOverMarker);
        marker.on('mouseout', mouseOutMarker);
        marker.on('contextmenu', deleteMarker);
        marker.on('click', clickOnMarker);
    }

    addEventsToMiddleMarkers = function(marker) {
        marker.on('dragstart', startDragMid);
        marker.on('dragend', endDragMid);
        marker.on('mouseover', mouseOverMarkerMiddle);
        marker.on('mouseout', mouseOutMarkerMid);
        marker.on('click', clickOnMarker);
    }
    clickOnMarker = function() {
    }
    updatePolyline = function() {
        routeGroup.removeLayer(polylineRoute);
        polylineRoute = L.polyline(poli, options).addTo(routeGroup);
        if (polyline2)
            routeGroup.removeLayer(polyline2);
        var len = poli.length;
        //if (len == 1) {
        //    //update middle marker
        //    map.removeLayer(midMarkers[0]);
        //    var midPoint = [
        //        (poli[0].lat + poli[1].lat) / 2.,
        //        (poli[0].lng + poli[1].lng) / 2.
        //    ];
        //    var newMidMarker = L.marker(midPoint, { draggable: true, icon: icon2 }).addTo(map);

        //    addEventsToMiddleMarkers(newMidMarker);
        //    midMarkers[0] = newMidMarker;

        //}
        if (len > 1) {

            //update right middle marker
            if (currentMarkerIndex != 0) {
                var rightMidMarker = midMarkers[previousIndex(currentMarkerIndex, len)];
                routeGroup.removeLayer(rightMidMarker);
                var midPoint = [
                    (poli[currentMarkerIndex].lat + poli[previousIndex(currentMarkerIndex, len)].lat) / 2.,
                    (poli[currentMarkerIndex].lng + poli[previousIndex(currentMarkerIndex, len)].lng) / 2.
                ];
                var newMidMarker = L.marker(midPoint, { draggable: true, icon: icon2 }).addTo(routeGroup);

                addEventsToMiddleMarkers(newMidMarker);
                midMarkers.splice(previousIndex(currentMarkerIndex, len), 1, newMidMarker);
            }
            if (len > 2) {
                //update left middle marker
                if (currentMarkerIndex != len - 1) {
                    var leftMidMarker = midMarkers[currentMarkerIndex];
                    routeGroup.removeLayer(leftMidMarker);
                    var midPoint = [
                        (poli[currentMarkerIndex].lat + poli[nextIndex(currentMarkerIndex, len)].lat) / 2.,
                        (poli[currentMarkerIndex].lng + poli[nextIndex(currentMarkerIndex, len)].lng) / 2.
                    ];
                    var newMidMarker = L.marker(midPoint, { draggable: true, icon: icon2 }).addTo(routeGroup);

                    addEventsToMiddleMarkers(newMidMarker);
                    midMarkers.splice(currentMarkerIndex, 1, newMidMarker);
                }
            }
        }

    }


    startDragMid = function(e) {

        undoLatLng = this._latlng;
        lastMarkerDragged = this;

        currentMarkerIndex = $.inArray(this, midMarkers);
        console.log('element ' + currentMarkerIndex + " din " + midMarkers.length);
        map.on('mousemove', mouseMoveMid);
        map.off('click', mapClickForEditingRoutes);

    }
    endDragMid = function(e) {

        poli.splice(currentMarkerIndex + 1, 0, this._latlng);
        map.off('mousemove', mouseMoveMid);

        if (polyline2)
            routeGroup.removeLayer(polyline2);

        routeGroup.removeLayer(polylineRoute);
        polylineRoute = L.polyline(poli, options).addTo(routeGroup);

        //add left and right middle markers
        var rightIndex = currentMarkerIndex;
        var midIndex = nextIndex(currentMarkerIndex, poli.length)
        var leftIndex = nextIndex(nextIndex(currentMarkerIndex, poli.length), poli.length);
        console.log('r: ' + rightIndex + ', m: ' + midIndex + ', l: ' + leftIndex + ', length: ' + poli.length);
        var midPoint = [
            (poli[rightIndex].lat + poli[midIndex].lat) / 2.,
            (poli[rightIndex].lng + poli[midIndex].lng) / 2.
        ];
        var newMidMarker = L.marker(midPoint, { draggable: true, icon: icon2 }).addTo(routeGroup);
        addEventsToMiddleMarkers(newMidMarker);
        midMarkers.splice(rightIndex, 1, newMidMarker);

        midPoint = [
            (poli[leftIndex].lat + poli[midIndex].lat) / 2.,
            (poli[leftIndex].lng + poli[midIndex].lng) / 2.
        ];
        var newMidMarker = L.marker(midPoint, { draggable: true, icon: icon2 }).addTo(routeGroup);
        addEventsToMiddleMarkers(newMidMarker);
        midMarkers.splice(midIndex, 0, newMidMarker);


        console.log('markers count: ' + midMarkers.length);

        if (undoIconMarker)
            routeGroup.removeLayer(undoIconMarker);
        undoIconMarker = L.marker(this._latlng, { icon: undoIcon }).addTo(routeGroup);
        undoIconMarker.on('mouseover', undoIconMouseEnter);
        undoIconMarker.on('mouseout', undoIconMouseLeave);
        undoIconMarker.on('click', undoMid);

        routeGroup.removeLayer(this);
        var newMarker = L.marker(this._latlng, { draggable: true, icon: icon1 }).addTo(routeGroup);
        addEventsToMarkers(newMarker);
        lastMarkerDragged = newMarker;
        currentMarkerIndex = midIndex;
        setTimeout(function() { map.on('click', mapClickForEditingRoutes); }, 300);
    }

    mouseMoveMid = function(e) {
        var poli2 = poli.slice();
        poli2.splice(nextIndex(currentMarkerIndex, poli2.length), 0, e.latlng);
        if (polyline2)
            routeGroup.removeLayer(polyline2);

        polyline2 = L.polyline(poli2, options).addTo(routeGroup);

    }

    undoMid = function() {

        if (undoIconMarker)
            routeGroup.removeLayer(undoIconMarker);

        console.log('current: ' + currentMarkerIndex);

        //undoLatLng = this._latlng;
        var rightIndex = previousIndex(currentMarkerIndex, poli.length);
        var leftIndex = nextIndex(currentMarkerIndex, poli.length);


        midPoint = [
            (poli[leftIndex].lat + poli[rightIndex].lat) / 2.,
            (poli[leftIndex].lng + poli[rightIndex].lng) / 2.
        ];
        var newMidMarker = L.marker(midPoint, { draggable: true, icon: icon2 }).addTo(routeGroup);
        addEventsToMiddleMarkers(newMidMarker);
        routeGroup.removeLayer(midMarkers[rightIndex]);
        routeGroup.removeLayer(midMarkers[currentMarkerIndex]);
        midMarkers.splice(rightIndex, 2, newMidMarker);


        poli.splice(currentMarkerIndex, 1)
        routeGroup.removeLayer(polylineRoute);
        polylineRoute = L.polyline(poli, options).addTo(routeGroup);

        routeGroup.removeLayer(lastMarkerDragged);


    }

    startDrag = function(e) {
        undoLatLng = this._latlng;
        lastMarkerDragged = this;
        currentMarkerIndex = $.inArray(this._latlng, poli);

        console.log('element ' + currentMarkerIndex + " din " + poli.length);
        map.on('mousemove', mouseMove);
        map.off('click', mapClickForEditingRoutes);

    }

    endDrag = function(e) {

        poli.splice(currentMarkerIndex, 1, this._latlng)
        map.off('mousemove', mouseMove);

        updatePolyline();

        if (undoIconMarker)
            routeGroup.removeLayer(undoIconMarker);
        undoIconMarker = L.marker(this._latlng, { icon: undoIcon }).addTo(routeGroup);
        undoIconMarker.on('mouseover', undoIconMouseEnter);
        undoIconMarker.on('mouseout', undoIconMouseLeave);
        undoIconMarker.on('click', undo);

        setTimeout(function() { map.on('click', mapClickForEditingRoutes); }, 300);

    }

    mouseMove = function(e) {

        var poli2 = poli.slice();
        poli2.splice(currentMarkerIndex, 1, e.latlng);
        if (polyline2)
            routeGroup.removeLayer(polyline2);

        polyline2 = L.polyline(poli2, options).addTo(routeGroup);

    }

    undo = function() {

        routeGroup.removeLayer(lastMarkerDragged);
        poli.splice(currentMarkerIndex, 1, undoLatLng)

        updatePolyline();

        if (undoIconMarker)
            routeGroup.removeLayer(undoIconMarker);

        var newMarker = L.marker(poli[currentMarkerIndex], { draggable: true, icon: icon1 }).addTo(routeGroup);
        addEventsToMarkers(newMarker);

    }


    undoIconMouseEnter = function() {
        this.setIcon(undoOverIcon);
    }
    undoIconMouseLeave = function() {
        this.setIcon(undoIcon);
    }

    mouseOverMarkerMiddle = function() {
        console.log('mid: ' + $.inArray(this, midMarkers));
        this.setIcon(icon4);

    }
    mouseOverMarker = function() {
        this.setIcon(icon3);
        console.log('no: ' + $.inArray(this._latlng, poli));

    }
    mouseOutMarkerMid = function() {
        this.setIcon(icon2);
    }
    mouseOutMarker = function() {
        this.setIcon(icon1);
    }

    makeRouteEditable = function() {
        
    }

    function mapClickForEditingRoutes(e) {
        console.log('click');

        poli.push(e.latlng);
        if (polylineRoute)
            routeGroup.removeLayer(polylineRoute);
        var newMarker = L.marker(e.latlng, { draggable: true, icon: icon1 }).addTo(routeGroup);

        addEventsToMarkers(newMarker);

        polylineRoute = L.polyline(poli, options).addTo(routeGroup);
        if (poli.length > 1) {
            var previousPoint = poli[poli.length - 2];
            var midPoint = [
                (e.latlng.lat + previousPoint.lat) / 2.,
                (e.latlng.lng + previousPoint.lng) / 2.
            ];
            var newMidMarker = L.marker(midPoint, { draggable: true, icon: icon2 }).addTo(routeGroup);

            addEventsToMiddleMarkers(newMidMarker);
            midMarkers.push(newMidMarker);

        }


        if (undoIconMarker)
            routeGroup.removeLayer(undoIconMarker);
        console.log('markers count: ' + midMarkers.length);
    }

    context.createDraggableMarker = function(markerIcon, lat, lng, latInput, longInput) {
        if (marker != undefined)
            map.removeLayer(marker);
        marker = new L.Marker([lat, lng], { icon: markerIcon, draggable: true });
        marker.addTo(map)


        marker.on('dragend', function(e) {
            var coords = e.target.getLatLng();
            var lat = coords.lat;
            var lng = coords.lng;
            latInput.val(lat);
            longInput.val(lng);
        });

        var coordinates = { latitude: lat, longitude: lng }
        return coordinates;
    }

    context.changeMarkerPosition = function (id, lat, lon) {
       var newLatLng = new L.LatLng(lat, lon);
       marker.setLatLng(newLatLng);
   };
    
     context.setFocus = function(latitude, longitude, zoom) {
            console.log("focus")
            var latlng = { lat: latitude, lng: longitude }
            map.setView(latlng, zoom);
        }

     context.addRoute = function(poli) {
            if (polylineRoute)
                route.removeLayer(polylineRoute);
            polylineRoute = L.polyline(poli, {
                opacity: 0.6,
                color: 'red',
                weight: 5,
                fillColor: '#90A8FF',
                fillOpacity: 0.5
            }).addTo(route);
            map.setView(poli[0]);

        }
     context.clearRoute = function () {
         midMarkers = [];
         poli = [];
         routeGroup.clearLayers();
         route.clearLayers();

     }

     context.MakeRouteEditable = function (path) {

        poli = path;
         if (poli.length > 0)
             makeRouteEditable();
        map.on('click', mapClickForEditingRoutes);
        console.log('route editable');
    }

    context.MakeRouteUneditable=function()
    {
        map.off('click', mapClickForEditingRoutes);
        console.log('route uneditable');
    }
})(mapApp);
