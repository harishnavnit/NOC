/* Embed the map to the webpage */

var socket = io.connect();

/**
 * Variables to display the main map
 */
L.mapbox.projectId = 'rharish.p2i83c48';
L.mapbox.accessToken = 'pk.eyJ1IjoicmhhcmlzaCIsImEiOiJjaWs4OWl4bGQwMWcydHhrd3ZmczdzN2lsIn0.mCz4ybX25lp0z7-rXXxqiQ';

var mapTiles = L.tileLayer('https://api.mapbox.com/v4/' + L.mapbox.projectId
                    + '/{z}/{x}/{y}.png?access_token=' + L.mapbox.accessToken, {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Mapbox</a>'
});
var map = L.map('map').addLayer(mapTiles).setView([0.0, 0.0], 2);
var markersList = [];
var devicesConnected = 0;

/**
 * Draws a circle on the map
 */
function drawCircle(lat, lng, radius) {
    L.circle([lat, lng], radius, {
       color: 'red',
       fillColor: '#f03',
       fillOpacity: 0.5
   }).addTo(map);
}

/**
 * Draw a polygon on the map
 * @param: array of latitude and longitude values
 */
function drawPolygon(latlngArray) {
    var polygonPoints = [];
    for (index = 0; index < latlngArray.length; ++index) {
        polygonPoints.insert(latlngArray[index].lat, latlngArray[index].lng);
    }
    return L.polygon(polygonPoints).addTo(map);
}

/**
 * Draw trajectories on the map
 */
function drawTrajectory(path) {
    var pointsList = [];
    for (index = 0; index < devicesConnected; ++index) {
        console.log("Current lat = " + path[index].lat);
        console.log("Current lng = " + path[index].lng);
        var point = new L.LatLng(path[index].lat, path[index].lng);
        pointsList.splice(index, 0, point);
    }
    var polyLine = new L.Polyline(pointsList, {
        color: 'red',
        weight: 3,
        opacity: 0.5,
        smoothFactor: 1
    });
    polyLine.addTo(map);
}

/**
 * Display the current position of devices
 */
function showCurrentObjectLocations() {
    console.log("\nObjects spotted at ");
    for (index = 0; index < markersList.length; index++) {
        console.log(markersList[index]);
        console.log("{" + markersList[index].lat + ", " + markersList[index].lng + "}");
    }
}

/**
 * Keep track of connected devices
 */
function pushMarkersToList(marker) {
    markersList.push(marker.getLatLng());
    ++devicesConnected;
    if (devicesConnected >= 2) drawTrajectory(markersList);
    showCurrentObjectLocations();

    var needsAlert = checkPotentialCollisions(marker.getLatLng().lat, marker.getLatLng().lng);

    if (needsAlert) {
        drawCircle(marker.getLatLng().lat, marker.getLatLng().lng, 100000.00);
        sendAlertToRemoteDevice();
    }
}

/**
 * Check if any two objects could possibly collide
 */
function checkPotentialCollisions(curr_lat, curr_lng) {
    console.log("\nScanning the zone for potential collisions");
    var R = 6372.795477598;     //Radius of the earth kms

    for (index = 0; index < markersList.length; index++) {
        var iter = markersList[index];
        var distance = R * Math.acos(
            Math.sin(curr_lat) * Math.sin(iter.lat) +
            Math.cos(curr_lat) * Math.cos(iter.lat) *
            Math.cos(curr_lng - iter.lng)
        );
        console.log("\nObject " + index + " is at distance of : " + distance + " meters ");
        if (distance == 0)  return false;
        else if (distance > 1500.0) return false;
        else return true;
    }
}

/**
 * Send an alert to the appropriate device
 */
function sendAlertToRemoteDevice() {
    console.log("\nAttempting to connect to remote device");
}

/**
 * Handle clicks on the map
 */
function onMapClick(e) {
    //alert("You clicked " + e.latlng);
    socket.emit('mapClick', e.latlng);
    var currLocation_popup = L.popup()
                                .setLatLng(e.latlng)
                                .setContent(e.latlng.toString())
                                .openOn(map);
    var currLocation_marker= L.marker(e.latlng).addTo(map);

    currLocation_marker.bindPopup(currLocation_popup).openPopup();
    pushMarkersToList(currLocation_marker);
}

map.on('click', onMapClick);
