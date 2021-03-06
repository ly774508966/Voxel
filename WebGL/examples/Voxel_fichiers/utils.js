
function drawLine (p0, p1, normal)
{
	var points = [];
	var p = {x:p0.x, y:p0.y, z:p0.z};
	var d = {x:p1.x-p0.x, y:p1.y-p0.y, z:p1.z-p0.z};
	var N = Math.max(Math.max(Math.abs(d.x), Math.abs(d.y)), Math.abs(d.z));
	var s = {x:d.x/N, y:d.y/N, z:d.z/N};
	//var voxelIndex = getIndexPosition(p);
	//if (voxelsIndexes.indexOf(voxelIndex) == -1) {
		points.push({x:Math.floor(p.x), y:Math.floor(p.y), z:Math.floor(p.z), n:normal});
		//voxelsIndexes.push(voxelIndex);
	//}
	for (var i = 1; i < N; i++) {
		p = { 	x: p.x + s.x,
				y: p.y + s.y,
				z: p.z + s.z};
		//if (voxelsIndexes.indexOf(voxelIndex) == -1) {
			points.push({x:Math.floor(p.x), y:Math.floor(p.y), z:Math.floor(p.z), n:normal});
			//voxelsIndexes.push(voxelIndex);
		//}
	}
	return points;
}	

function getVoxelsFromMesh(vertices, faces, scale, unit) {
	var voxels = [];
	var cb = new THREE.Vector3();
	var ab = new THREE.Vector3();
	for (var f = 0; f < faces.length; f++) {
		var face = faces[f];
		var pA = {
			x:vertices[face.a].x * scale,
			y:vertices[face.a].y * scale,
			z:vertices[face.a].z * scale};
		var pB = {
			x:vertices[face.b].x * scale,
			y:vertices[face.b].y * scale,
			z:vertices[face.b].z * scale};
		var pC = {
			x:vertices[face.c].x * scale,
			y:vertices[face.c].y * scale,
			z:vertices[face.c].z * scale};

		// Distance from A to C
		var dAC =  Math.floor(distance(pA, pC) / unit);

		// Normal
		cb.subVectors( pC, pB );
		ab.subVectors( pA, pB );
		cb.cross( ab );
		cb.normalize();

		for (var i = 0; i < dAC; i++) {
			var delta = i/dAC;
			var p0 = {
				x:pA.x * (1 - delta) + delta * pC.x,
				y:pA.y * (1 - delta) + delta * pC.y,
				z:pA.z * (1 - delta) + delta * pC.z};
			var p1 = {
				x:pB.x * (1 - delta) + delta * pC.x,
				y:pB.y * (1 - delta) + delta * pC.y,
				z:pB.z * (1 - delta) + delta * pC.z};

			var line = drawLine(p0, p1, {x:cb.x, y:cb.y, z:cb.z});
			voxels.push.apply(voxels, line);
		}
	}
	return voxels;
}

function distance (p0, p1)
{
	return Math.sqrt((p1.x-p0.x)*(p1.x-p0.x)+(p1.y-p0.y)*(p1.y-p0.y)+(p1.z-p0.z)*(p1.z-p0.z));
}

function getGridPosition (index)
{
	return new THREE.Vector3 (
			VOXEL_SIZE * ((index % GRID_SIZE)),
			VOXEL_SIZE * ((Math.floor(index / GRID_SIZE) % GRID_SIZE)),
			VOXEL_SIZE * ((Math.floor(index / (GRID_SIZE*GRID_SIZE)) % GRID_SIZE)));
}
function getIndexPosition (position)
{
	return Math.floor((position.x
					 + position.y * GRID_SIZE
					 + position.z * GRID_SIZE * GRID_SIZE) / VOXEL_SIZE);
}
/*
function getGridPosition (index, lod)
{
	var gSize = GRID_SIZE / Math.pow(2, lod);
	var vSize = VOxEL_SIZE * Math.pow(2, lod);
	return new THREE.Vector3 (
			vSize * ((index % gSize)),
			vSize * ((Math.floor(index / gSize) % gSize)),
			vSize * ((Math.floor(index / (gSize*gSize)) % gSize)));
}
*/
function getIdPosition (position)
{
	return Math.floor(position.x) + "_" + Math.floor(position.y) + "_" + Math.floor(position.z);
}

function dotProduct(p1, p2) {
	return p1.x * p2.x + p1.y * p2.y + p1.z * p2.z;
}

function plane(x, z, p0, n) {
	var d = -n.x * p0.x - n.y * p0.y - n.z * p0.z;
	return  (- n.x*x - n.z*z - d) / (n.y);
}