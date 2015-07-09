//All Connichiwa-related stuff should always be done in Connichiwa.onLoad()
Connichiwa.onLoad(function() {
  //Get our master template and insert it into the body
  CWTemplates.load("template_master.html");
  CWTemplates.insert("master", "body");

//  Connichiwa.on('test', function(d) {
//    console.log(d);
//    console.log('jfkaljfl----------------------------------');
//  });

  //Set the initial template data
  setDetectedDevices(0);
  setConnectedDevices(0);
  var ips = Connichiwa.getIPs();
  if (ips.length > 0) {
    CWTemplates.set("local_url", ips[0]+":"+Connichiwa.getPort());
  }

  //Let's connect any nearby device automatically
  Connichiwa.autoConnect = true;
  
  Connichiwa.on("deviceDetected", function() {
    //Increase nearby devices
    var detectedDevices = CWTemplates.get('devices_nearby_count');
    setDetectedDevices(detectedDevices + 1);
  });

  Connichiwa.on("deviceLost", function() {
    //Decrease nearby devices
    var detectedDevices = CWTemplates.get('devices_nearby_count');
    setDetectedDevices(detectedDevices - 1);
  });

  var devices = [];
  var pictures = ['http://nyulocal.com/wp-content/uploads/2015/05/tumblr_static_30188hiseinfeld1.jpg',
  'http://www.sonypictures.com/tv/seinfeld/assets/images/onesheet.jpg',
  'https://tctechcrunch2011.files.wordpress.com/2015/03/seinfeld.jpg',
  'http://mediad.publicbroadcasting.net/p/demowgbh/files/201407/SeinfeldA.jpg']

  Connichiwa.on('getInfo', function(id) {
    console.log(id);
//    var device = CWDeviceManager.getDeviceWithIdentifier(id);
//    device.send('get-info', {'id': 'blabla'});
    console.log('aaaaaaa');
  });

//
  Connichiwa.onMessage('getInfo', function(a) {
    console.log('bbbbb');
    debugger;
  });

  Connichiwa.on("deviceConnected", function(device) {
    //Increase connected devices
    var connectedDevices = CWTemplates.get('devices_connected_count');
//    setConnectedDevices(connectedDevices+1);
    CWTemplates.set('devices_connected_count', connectedDevices + 1);
    device._name = 'device ' + (connectedDevices + 1);
    //Load CSS and insert the remote template into the new device. The remote 
    //template shows the devices current distance (also see "deviceDistanceChanged")
    //
    //The third parameter to .insertTemplate() is the name of the data store the
    //template uses. Each remote template gets its own data (since each displays 
    //its individual distance). As you will see in updateRemoteDistance(), we 
    //use this name to determine which devices UI is updated
    device.loadCSS("styles.css");
    device.loadTemplates("template_remote.html");
    device.insertTemplate("remote", "body", device.getIdentifier());
    updateRemoteDistance(device);
    devices.push(device);

    for (var i = 0; i < devices.length; i++) {
      var devicesIds = [];
      for (var j = 0; j < devices.length; j++) {
        if (devices[j].getIdentifier() != devices[i].getIdentifier()) {
          devicesIds.push({id: devices[j].getIdentifier(),
            name: devices[j].getName()});
        }
      }
      CWTemplates.set(devices[i].getIdentifier(), 'devices_connected_count', connectedDevices + 1);
      CWTemplates.set(devices[i].getIdentifier(), 'image', pictures[i]);
      CWTemplates.set(devices[i].getIdentifier(), 'devices_list',  devicesIds);
      CWTemplates.set(devices[i].getIdentifier(), 'deviceId', devices[i].getName());
        console.log(devices[i].getIdentifier());
    }

  });

  Connichiwa.on('wasStitched', function(a, b) {
    console.log('STITCH');
    console.log(a, b);
  });

  Connichiwa.on("deviceDisconnected", function() {
    //Decrease connected devices
    var connectedDevices = CWTemplates.get('devices_connected_count');
    setConnectedDevices(connectedDevices-1);
  });

  //Live-update the distance on remote distance as soon as they change
  Connichiwa.on("deviceDistanceChanged", function(device) {
    updateRemoteDistance(device);
  });

  function setDetectedDevices(value) {
    //Set the template data to reflect the new nearby device count
    //CWTemplates will automatically make the UI reflect the new data
    CWTemplates.set('devices_nearby_count', value);
    CWTemplates.set('devices_nearby_text_devices', pluralize("device", value));
  }

  function setConnectedDevices(value) {
    //Set the template data to reflect the new connected device count
    //CWTemplates will automatically make the UI reflect the new data
    CWTemplates.set('devices_connected_count', value);
    CWTemplates.set('deviceId', 'aaaaaa');
    CWTemplates.set('devices_list', [{id: "jkadk"}]);
    CWTemplates.set('image', 'image');
//    CWTemplates.set('devices_connected_text_devices', pluralize("device", value));
  }

  function updateRemoteDistance(device) {
    //Update the template data to reflect the new distance
    //Since each device shows a different distance, we set the distance on 
    //that device's data store only (by using the devices identifier as the 
    //data store's name). This way, only this devices UI is affected.
    if (device.getDistance() >= 0) { 
      CWTemplates.set(device.getIdentifier(), "distance", device.getDistance());
    } else { //distance cannot be determined
      CWTemplates.set(device.getIdentifier(), "distance", "unknown");
    }
  }
});

function pluralize(word, number) {
  if (number === 1) return word;
  return word+"s";
}