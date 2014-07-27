;(function(exports) {
  // creates lines and circles and starts the animation
  function start() {
    var screen = document.getElementById('circles-bouncing-off-lines').getContext('2d');

    var world = {
      circles: [],
      lines: [
        makeLine({ x: 100, y: 100 }),
        makeLine({ x: 200, y: 100 }),
        makeLine({ x: 150, y: 150 }),
        makeLine({ x: 100, y: 200 }),
        makeLine({ x: 220, y: 200 }),
      ],
      dimensions: { x: screen.canvas.width, y: screen.canvas.height },
      timeLastCircleMade: 0
    };

    // make grid of lines
    for (var i = 1; i < 6; i++) {
      for (var j = 1; j < 6; j++) {
        world.lines.push();
      }
    }
    world.lines.splice(10, 2); // throw away top center lines

    // move shapes, draw shapes
    function tick() {
      update(world);
      draw(world, screen);
      requestAnimationFrame(tick); // queues next tick with browser
    };

    tick(); // start update/draw loop
  };
  exports.start = start; // make start function available to HTML page

  // rotates the lines, moves and bounces the circles
  function update(world) {
    for (var i = world.circles.length - 1; i >= 0; i--) {
      for (var j = 0; j < world.lines.length; j++) {
        physics.bounceCircle(world.circles[i], world.lines[j]);
      }

      physics.moveCircle(world.circles[i]);
      if (!isCircleInWorld(world.circles[i], world.dimensions)) {
        world.circles.splice(i, 1); // remove circles that have left screen
      }
    }

    for (var i = 0; i < world.lines.length; i++) {
      world.lines[i].angle += world.lines[i].rotateSpeed;
    }

    // occasionally make a circle
    var now = new Date().getTime();
    if (now - world.timeLastCircleMade > 400) {
      world.circles.push(makeCircle({ x: world.dimensions.x / 2, y: -5 }));
      world.timeLastCircleMade = now;
    }
  };

  function draw(world, screen) {
    // fill screen with white
    screen.fillStyle = "white";
    screen.fillRect(0, 0, world.dimensions.x, world.dimensions.y);

    var bodies = world.circles.concat(world.lines);
    for (var i = 0; i < bodies.length; i++) {
      bodies[i].draw(screen);
    }
  };

  function makeCircle(center) {
    return {
      center: center,
      velocity: { x: 0, y: 0 },
      radius: 5,
      draw: function(screen) {
        screen.beginPath();
        screen.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2, true);
        screen.closePath();
        screen.fillStyle = "black";
        screen.fill();
      }
    };
  };

  function makeLine(center) {
    return {
      center: center,
      span: 70,
      angle: 0,
      rotateSpeed: 0.5,
      draw: function(screen) {
        var end1 = trig.lineEndPoints(this)[0];
        var end2 = trig.lineEndPoints(this)[1];

        screen.beginPath();
        screen.lineWidth = 1.5;
        screen.moveTo(end1.x, end1.y);
        screen.lineTo(end2.x, end2.y);
        screen.closePath();

        screen.strokeStyle = "black";
        screen.stroke();
      }
    };
  };

  function isCircleInWorld(circle, worldDimensions) {
    return circle.center.x > -circle.radius &&
      circle.center.x < worldDimensions.x + circle.radius &&
      circle.center.y > -circle.radius &&
      circle.center.y < worldDimensions.y + circle.radius;
  };

  var trig = {
    distance: function(point1, point2) {
      var x = point1.x - point2.x;
      var y = point1.y - point2.y;
      return Math.sqrt((x * x) + (y * y));
    },

    magnitude: function(vector) {
      return Math.sqrt(vector.x * vector.x + vector.y* vector.y);
    },

    unitVector: function(vector) {
      return {
        x: vector.x / trig.magnitude(vector),
        y: vector.y / trig.magnitude(vector)
      };
    },

    dotProduct: function(vector1, vector2) {
      return vector1.x * vector2.x + vector1.y * vector2.y;
    },

    vectorBetween: function(startPoint, endPoint) {
      return {
        x: endPoint.x - startPoint.x,
        y: endPoint.y - startPoint.y
      };
    },

    // returns the points at the two ends of the passed line
    lineEndPoints: function(line) {
      var angleRadians = line.angle * 0.01745;
      var lineUnitVector = trig.unitVector({
        x: Math.cos(angleRadians) * 0 - Math.sin(angleRadians) * -1,
        y: Math.sin(angleRadians) * 0 + Math.cos(angleRadians) * -1
      });

      return [{
        x: line.center.x + lineUnitVector.x * line.span / 2,
        y: line.center.y + lineUnitVector.y * line.span / 2
      }, {
        x: line.center.x - lineUnitVector.x * line.span / 2,
        y: line.center.y - lineUnitVector.y * line.span / 2
      }];
    },

    // returns point on passed line closest to passed circle
    pointOnLineClosestToCircle: function(circle, line) {
      var lineEndPoint1 = trig.lineEndPoints(line)[0];
      var lineEndPoint2 = trig.lineEndPoints(line)[1];

      // vector representing line surface
      var lineUnitVector = trig.unitVector(
        trig.vectorBetween(lineEndPoint1, lineEndPoint2));

      // project vector between line end and circle along line to get
      // distance between end and point on line closest to circle
      var projection = trig.dotProduct(trig.vectorBetween(lineEndPoint1, circle.center),
                                       lineUnitVector);

      if (projection <= 0) {
        return lineEndPoint1; // off end of line - end is closest point
      } else if (projection >= line.span) {
        return lineEndPoint2; // ditto
      } else {
        // part way along line - return that point
        return {
          x: lineEndPoint1.x + lineUnitVector.x * projection,
          y: lineEndPoint1.y + lineUnitVector.y * projection
        };
      }
    },

    isCircleIntersectingLine: function(circle, line) {
      var closest = trig.pointOnLineClosestToCircle(circle, line);
      var circleToLineDistance = trig.distance(circle.center, closest);
      return circleToLineDistance < circle.radius;
    }
  }

  var physics = {
    // move passed circle based on its current speed
    moveCircle: function(circle) {
      // simulate gravity
      circle.velocity.y = circle.velocity.y + 2;

      // move according to current velocity
      circle.center.x = circle.center.x + circle.velocity.x / 30;
      circle.center.y = circle.center.y + circle.velocity.y / 30;
    },

    // bounces circle off line
    bounceCircle: function(circle, line) {
      var lineNormal = physics.bounceNormal(circle, line);
      if (lineNormal === undefined) return; // line not touching circle - no bounce

      // set new circle velocity by reflecting old velocity in
      // the normal to the surface the circle is bouncing off
      var dot = trig.dotProduct(circle.velocity, lineNormal);
      circle.velocity.x = circle.velocity.x - 2 * dot * lineNormal.x;
      circle.velocity.y = circle.velocity.y - 2 * dot * lineNormal.y;

      // move circle until outside line
      while (trig.isCircleIntersectingLine(circle, line)) {
        physics.moveCircle(circle);
      }
    },

    // if line intersecting circle, returns normal to use to bounce circle
    bounceNormal: function(circle, line) {
      if (trig.isCircleIntersectingLine(circle, line)) {
        return trig.unitVector(trig.vectorBetween(
          trig.pointOnLineClosestToCircle(circle, line),
          circle.center));
      }
    }
  };

  // Start
  // -----

  // When the DOM is ready, create (and start) the animation.
  window.addEventListener('load', start);
})(this);
