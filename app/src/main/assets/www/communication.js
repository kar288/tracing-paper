var centralDevice;

$(document).on('click', '.get-data', function(e) {
  e.preventDefault();
//  var from = $(this).attr('id');
	var from = CWDatastore.get('occluded');

	if (!from || $('#canvas-' + from).length) {
		return;
	}

	$('.canvas-container').append('<canvas id="canvas-' + from + '"></canvas>');
	var ctxFrom = newCanvas('canvas-' + from);
	ctxs[from] = ctxFrom;

  Connichiwa.broadcast('getInfo', {'id': from});

  var pathCount = CWDatastore.get('paths-' + from) || 0;
  for (var i = 1; i <= pathCount; i++) {
  	var pathId = 'path-' + from + '-' + i;
  	var path = CWDatastore.get('paths', pathId);
		drawPath(ctxFrom, path, '#CCCCCC');
  }
  return false;
});

$(document).on('click', '.save-path', function(e) {
  e.preventDefault();

	var from = CWDatastore.get('occluded');

  var pathCount = CWDatastore.get('paths-' + from) || 0;
  for (var i = 1; i <= pathCount; i++) {
  	var pathId = 'path-' + from + '-' + i;
  	var path = CWDatastore.get('paths', pathId);
		drawPath(ctx, path, 'black');
  }

  return false;
});

Connichiwa.onMessage('not-occluded-anymore', function(e) {
	for (var ctx in ctxs) {
		$('#canvas-' + ctx).remove();
	}
	ctxs = {};
});

Connichiwa.onMessage('getInfo', function(a) {
  if (a.id == Connichiwa.getIdentifier()) {
  	var source = a._source;
  	centralDevice = source;
//    Connichiwa.broadcast('sendImage', {'image': $('img').attr('src'), 'id': source});
  }
});

var ctx, color = '#000';
var ctxs = {};

$( document ).ready(function(){
	// setup a new canvas for drawing wait for device init
  setTimeout(function(){
	  ctx = newCanvas('canvas');
  }, 1000);

 if (('onuserproximity' in window)) {
		window.addEventListener('userproximity', function(event) {
			 if (event.near) {
			 		CWDatastore.set('occluded', Connichiwa.getIdentifier());
			 } else {
			 		CWDatastore.set('occluded', null);
			 		Connichiwa.broadcast('not-occluded-anymore', {});
			 }
		});
 }
}, false );

var drawPath = function(ctx, path, color) {
	ctx.beginPath();
	ctx.moveTo(path[0].x, path[0].y);
	for (var i = 0; i < path.length; i++) {
		var point = path[i];
		ctx.lineTo(point.x, point.y);
		ctx.strokeStyle = color || 'black';
		ctx.stroke();
	}
}

// function to setup a new canvas for drawing
function newCanvas(id){
  // setup canvas
	$('#' + id).attr('width', window.innerWidth);
	$('#' + id).attr('height', window.innerHeight / 2);
	var ctx = document.getElementById(id).getContext('2d');
	ctx.strokeStyle = color;
	ctx.lineWidth = 1;

	// setup to trigger drawing on mouse or touch
	drawTouch(ctx);
	drawPointer(ctx);
	drawMouse(ctx);
	return ctx;
}

var start = function(pos, clicked) {
	ctx.beginPath();
	x = pos.x;
	y = pos.y;
	ctx.moveTo(x,y);
	console.log('start', {x: x, y: y});
	var pathNumber = CWDatastore.get('paths-' +  Connichiwa.getIdentifier()) || 0;
	pathNumber++;
	CWDatastore.set('paths-' +  Connichiwa.getIdentifier(), pathNumber);
	CWDatastore.set('paths', 'path-' + Connichiwa.getIdentifier() + '-' + pathNumber,
		[{x: x, y: y}]);

	Connichiwa.broadcast('startDraw', {x: x, y: y, to: centralDevice});
};

var move = function(pos, clicked) {
	if(clicked){
		x = pos.x;
		y = pos.y;
		ctx.lineTo(x,y);
		ctx.stroke();
		console.log('move', {x: x, y: y});

		var pathNumber = CWDatastore.get('paths-' +  Connichiwa.getIdentifier());
		var pathId = 'path-' + Connichiwa.getIdentifier() + '-' + pathNumber;
		var path = CWDatastore.get('paths', pathId);
		path.push({x: x, y: y});
		CWDatastore.set('paths', pathId, path);
		Connichiwa.broadcast('moveDraw', {x: x, y: y, to: centralDevice});
	}
};

Connichiwa.onMessage('moveDraw', function(pos) {
	if (pos.to != Connichiwa.getIdentifier()) {
		return;
	}
	console.log('move', pos);
	var ctx = ctxs[pos._source];
  ctx.lineTo(pos.x, pos.y);
	ctx.stroke();
});

Connichiwa.onMessage('startDraw', function(pos) {
	if (pos.to != Connichiwa.getIdentifier()) {
		return;
	}
	console.log('start', pos);
	var ctx = ctxs[pos._source];
	ctx.beginPath();
	ctx.moveTo(pos.x, pos.y);
});


// prototype to	start drawing on mouse using canvas moveTo and lineTo
var drawMouse = function() {
	var clicked = 0;
  $('canvas').on('mousedown', function(e) {
  	clicked = 1;
  	start({x: e.pageX, y: e.pageY});
	});
	$('canvas').on('mousemove', function(e) {
		move({x: e.pageX, y: e.pageY}, clicked);
	});
	document.addEventListener('mouseup', function(e) {
	  clicked = 0;
	});
};

// prototype to	start drawing on touch using canvas moveTo and lineTo
var drawTouch = function() {
  $('canvas').on('touchstart', function(e) {
  	ctx.beginPath();
		x = e.originalEvent.changedTouches[0].pageX;
		y = e.originalEvent.changedTouches[0].pageY;
		ctx.moveTo(x,y);
		start({x: x, y: y});
		Connichiwa.broadcast('moveDraw', {x: x, y: y});
  });
	$('canvas').on('touchmove', function(e) {
		e.preventDefault();
		var x = e.originalEvent.changedTouches[0].pageX;
		var y = e.originalEvent.changedTouches[0].pageY;
		move({x: x, y: y}, true /* clicked */);
		Connichiwa.broadcast('startDraw', {x: x, y: y});
	});
};

// prototype to	start drawing on pointer(microsoft ie) using canvas moveTo and lineTo
var drawPointer = function() {
	var start = function(e) {
        e = e.originalEvent;
		ctx.beginPath();
		x = e.pageX;
		y = e.pageY-44;
		ctx.moveTo(x,y);
	};
	var move = function(e) {
		e.preventDefault();
        e = e.originalEvent;
		x = e.pageX;
		y = e.pageY-44;
		ctx.lineTo(x,y);
		ctx.stroke();
  };
  $('canvas').on('MSPointerDown', start, false);
	$('canvas').on('MSPointerMove', move, false);
};


