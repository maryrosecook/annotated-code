;(function(exports) {

  // The top-level functions that run the simulation
  // -----------------------------------------------

  // **start()** creates the lines and circles and starts the simulation.
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

    // move shapes, draw shapes
    function tick() {
      update(world);
      draw(world, screen);
      requestAnimationFrame(tick); // queues next tick with browser
    };

    tick(); // start update/draw loop
  };

  // Export start() so it can be run by index.html
  exports.start = start;

  // **update()** updates the state of the lines and circles.
  function update(world) {

    // Move and bounce the circles.
    updateCircles(world)

    // Create new circle if one hasn't been created for a while.
    createNewCircleIfDue(world);

    // Rotate the lines.
    updateLines(world);
  };

  // **updateCircles()** moves and bounces the circles.
  function updateCircles(world) {
    for (var i = world.circles.length - 1; i >= 0; i--) {
      var circle = world.circles[i];

      // Run through all lines.
      for (var j = 0; j < world.lines.length; j++) {
        var line = world.lines[j];

        // If `line` is intersecting `circle`, bounce circle off line.
        if (trig.isLineIntersectingCircle(circle, line)) {
          physics.bounceCircle(circle, line);
        }
      }

      // Apply gravity to the velocity of `circle`.
      physics.applyGravity(circle);

      // Move `circle` according to its velocity.
      physics.moveCircle(circle);

      // Remove circles that are off screen.
      if (!isCircleInWorld(circle, world.dimensions)) {
        world.circles.splice(i, 1);
      }
    }
  };

  // **createNewCircleIfDue()** creates a new circle every so often.
  function createNewCircleIfDue(world) {
    var now = new Date().getTime();
    if (now - world.timeLastCircleMade > 400) {
      world.circles.push(makeCircle({ x: world.dimensions.x / 2, y: -5 }));

      // Update last circle creation time.
      world.timeLastCircleMade = now;
    }
  };

  // **updateLines()** rotates the lines.
  function updateLines(world) {
    for (var i = 0; i < world.lines.length; i++) {
      world.lines[i].angle += world.lines[i].rotateSpeed;
    }
  };

  // **draw()** draws the all the circles and lines in the simulation.
  function draw(world, screen) {
    // Clear away the drawing from the previous tick.
    screen.clearRect(0, 0, world.dimensions.x, world.dimensions.y);

    var bodies = world.circles.concat(world.lines);
    for (var i = 0; i < bodies.length; i++) {
      bodies[i].draw(screen);
    }
  };

  // **makeCircle()** creates a circle that has the passed `center`.
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

  // **makeLine()** creates a line that has the passed `center`.
  function makeLine(center) {
    return {
      center: center,
      len: 70,
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

  // **isCircleInWorld()** returns true if `circle` is on screen.
  function isCircleInWorld(circle, worldDimensions) {
    return circle.center.x > -circle.radius &&
      circle.center.x < worldDimensions.x + circle.radius &&
      circle.center.y > -circle.radius &&
      circle.center.y < worldDimensions.y + circle.radius;
  };

  // Trigonometry functions to help with calculating ball movement
  // -------------------------------------------------------------

  var trig = {

    // **distance()** returns the distance between `point1` and `point2`
    // as the crow flies.  Uses Pythagoras's theorem.
    distance: function(point1, point2) {
      var x = point1.x - point2.x;
      var y = point1.y - point2.y;
      return Math.sqrt(x * x + y * y);
    },

    // **magnitude()** returns the magnitude of the passed vector.
    // Sort of like the vector's speed.  A vector with a larger x or y
    // will have a larger magnitude.
    magnitude: function(vector) {
      return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    },

    // **unitVector()** returns the unit vector for `vector`.
    // A unit vector points in the same direction as the original,
    // but has a magnitude of 1.  It's like a direction with a
    // speed that is the same as all other unit vectors.
    unitVector: function(vector) {
      return {
        x: vector.x / trig.magnitude(vector),
        y: vector.y / trig.magnitude(vector)
      };
    },

    // **dotProduct()** returns the dot product of `vector1` and
    // `vector2`. A dot product represents the amount one vector goes
    // in the direction of the other.  Imagine `vector2` runs along
    // the ground and `vector1` represents a ball fired from a
    // cannon. If `vector2` is multiplied by the dot product of the
    // two vectors, it produces a vector that represents the amount
    // of ground covered by the ball.
    dotProduct: function(vector1, vector2) {
      return vector1.x * vector2.x + vector1.y * vector2.y;
    },

    // **vectorBetween()** returns the vector that runs between `startPoint`
    // and `endPoint`.
    vectorBetween: function(startPoint, endPoint) {
      return {
        x: endPoint.x - startPoint.x,
        y: endPoint.y - startPoint.y
      };
    },

    // **lineEndPoints()** returns an array containing the points
    // at each end of `line`.
    lineEndPoints: function(line) {
      var angleRadians = line.angle * 0.01745;
      var lineUnitVector = trig.unitVector({
        x: Math.cos(angleRadians),
        y: Math.sin(angleRadians)
      });

      return [{
        x: line.center.x + lineUnitVector.x * line.len / 2,
        y: line.center.y + lineUnitVector.y * line.len / 2
      }, {
        x: line.center.x - lineUnitVector.x * line.len / 2,
        y: line.center.y - lineUnitVector.y * line.len / 2
      }];
    },

    // **pointOnLineClosestToCircle()** returns the point on `line`
    // closest to `circle`.
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
      } else if (projection >= line.len) {
        return lineEndPoint2; // ditto
      } else {
        // part way along line - return that point
        return {
          x: lineEndPoint1.x + lineUnitVector.x * projection,
          y: lineEndPoint1.y + lineUnitVector.y * projection
        };
      }
    },

    // **isLineIntersectingCircle()** returns true if `line` is
    // intersecting `circle`.
    isLineIntersectingCircle: function(circle, line) {
      var closest = trig.pointOnLineClosestToCircle(circle, line);
      var circleToLineDistance = trig.distance(circle.center, closest);
      return circleToLineDistance < circle.radius;
    }
  }

  // Physics functions for calculating ball movement
  // -----------------------------------------------

  var physics = {

    // **applyGravity()** adds gravity to the velocity of `circle`.
    applyGravity: function(circle) {
      circle.velocity.y += 0.06;
    },

    // **moveCircle()** adds the velocity of the circle to its center.
    moveCircle: function(circle) {
      circle.center.x += circle.velocity.x;
      circle.center.y += circle.velocity.y;
    },

    // **bounceCircle()** assumes `line` is intersecting `circle` and
    // bounces `circle` off `line`.
    bounceCircle: function(circle, line) {
      var bounceLineNormal = physics.bounceLineNormal(circle, line);

      // set new circle velocity by reflecting old velocity in
      // the normal to the surface the circle is bouncing off
      var dot = trig.dotProduct(circle.velocity, bounceLineNormal);
      circle.velocity.x -= 2 * dot * bounceLineNormal.x;
      circle.velocity.y -= 2 * dot * bounceLineNormal.y;

      // move circle until outside line
      while (trig.isLineIntersectingCircle(circle, line)) {
        physics.moveCircle(circle);
      }
    },

    // **bounceLineNormal()** assumes `line` intersects `circle`.  It
    // returns the normal to the side of the line that the `circle` is
    // hitting.
    bounceLineNormal: function(circle, line) {
      return trig.unitVector(trig.vectorBetween(
        trig.pointOnLineClosestToCircle(circle, line),
        circle.center));
    }
  };

  // Start
  // -----

  // When the DOM is ready, create (and start) the simulation.
  window.addEventListener('load', start);
})(this);
