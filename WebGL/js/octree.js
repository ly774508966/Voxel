
Octree = function(origin_, halfDimension_) {
	// Physical position/size. This implicitly defines the bounding 
	// box of this node
	this.origin = origin_;         //! The physical center of this node
	this.halfDimension = halfDimension_;  //! Half the width/height/depth of this node

	// The tree has up to eight children and can additionally store
	// a point, though in many applications only, the leaves will store data.
	this.children = new Array(8); //! Pointers to child octants
	for (var i = 0; i < 8; ++i) { this.children[i] = undefined; }
	this.data = undefined;   //! Data point to be stored at a node

	/*
			Children follow a predictable pattern to make accesses simple.
			Here, - means less than 'origin' in that dimension, + means greater than.
			child:	0 1 2 3 4 5 6 7
			x:      - - - - + + + +
			y:      - - + + - - + +
			z:      - + - + - + - +
	 */

	// Determine which octant of the tree would contain 'point'
	this.getOctantContainingPoint = function(point) {
		var oct = 0;
		if(point.x >= this.origin.x) oct |= 4;
		if(point.y >= this.origin.y) oct |= 2;
		if(point.z >= this.origin.z) oct |= 1;
		return oct;
	}

	this.isLeafNode = function() {
		// We are a leaf iff we have no children. Since we either have none, or 
		// all eight, it is sufficient to just check the first.
		return this.children[0] == undefined;
	}

	this.insert = function(point) {
		// If this node doesn't have a data point yet assigned 
		// and it is a leaf, then we're done!
		if (this.isLeafNode()) {
			// console.log(this.data);
			if (this.data == undefined) {
				this.data = point;
				return;
			} else {
				// We're at a leaf, but there's already something here
				// We will split this node so that it has 8 child octants
				// and then insert the old data that was here, along with 
				// this new data point

				// Save this data point that was here for a later re-insert
				var oldPoint = this.data;
				this.data = undefined;

				// Split the current node and create new empty trees for each
				// child octant.
				for(var i=0; i<8; ++i) {
					// Compute new bounding box for this child
					var newOrigin = {
						x: this.origin.x + this.halfDimension.x * ((i&4) != 0 ? 0.5 : -0.5),
						y: this.origin.y + this.halfDimension.y * ((i&2) != 0 ? 0.5 : -0.5),
						z: this.origin.z + this.halfDimension.z * ((i&1) != 0 ? 0.5 : -0.5)};
					var newDimension = { 
						x: this.halfDimension.x * 0.5,
						y: this.halfDimension.y * 0.5,
						z: this.halfDimension.z * 0.5};
					this.children[i] = new Octree(newOrigin, newDimension);
				}

				// Re-insert the old point, and insert this new point
				// (We wouldn't need to insert from the root, because we already
				// know it's guaranteed to be in this section of the tree)
				this.children[this.getOctantContainingPoint(oldPoint)].insert(oldPoint);
				this.children[this.getOctantContainingPoint(point)].insert(point);
			}
		} else {
			// We are at an interior node. Insert recursively into the 
			// appropriate child octant
			var octant = this.getOctantContainingPoint(point);
			this.children[octant].insert(point);
		}
	}

	// This is a really simple routine for querying the tree for points
	// within a bounding box defined by min/max points (bmin, bmax)
	// All results are pushed into 'results'
	function getPointsInsideBox(bmin, bmax, results) {
		// If we're at a leaf node, just see if the current data point is inside
		// the query bounding box
		if (this.isLeafNode()) {
			if (this.data !== undefined) {
				var p = this.data.position;
				if (p.x>bmax.x || p.y>bmax.y || p.z>bmax.z) return;
				if (p.x<bmin.x || p.y<bmin.y || p.z<bmin.z) return;
				results.Add(this.data);
			}
		} else {
			// We're at an interior node of the tree. We will check to see if
			// the query bounding box lies outside the octants of this node.
			for(var i=0; i<8; ++i) {
				// Compute the min/max corners of this child octant
				var ori = this.children[i].origin;
				var half = this.children[i].halfDimension;
				var cmax = { x:ori.x + half.x, y: ori.y + half.y, z: ori.z + half.z };
				var cmin = { x:ori.x - half.x, y: ori.y - half.y, z: ori.z - half.z };

				// If the query rectangle is outside the child's bounding box, 
				// then continue
				if(cmax.x<bmin.x || cmax.y<bmin.y || cmax.z<bmin.z) continue;
				if(cmin.x>bmax.x || cmin.y>bmax.y || cmin.z>bmax.z) continue;

				// At this point, we've determined that this child is intersecting 
				// the query bounding box
				this.children[i].getPointsInsideBox(bmin,bmax,results);
			} 
		}
	}
}
