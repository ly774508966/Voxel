//
function distanceBetween(a, b) { return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y)+(a.z-b.z)*(a.z-b.z)); }

///////////////////////////////////////////////////////////////////////////////////////////////
// Display Handlers 

function updateDisplay()
{
	// Model
	model.visible = parameters.modelVisible;
	model.material.color = new THREE.Color(parameters.modelColor);
	model.material.wireframe = parameters.modelWire;
	// model.material.shading = parameters.modelSmooth ? THREE.SmoothShading : THREE.FlatShading;

	// Voxels
	rootMeshVoxel.visible = parameters.voxelVisible;
	// Wireframe
	for (var m = 0; m < rootMeshVoxel.material.materials.length; m++) {
		rootMeshVoxel.material.materials[m].wireframe = parameters.voxelWire;
	}
	// User color
	rootMeshVoxel.material.materials[1].color = new THREE.Color(parameters.voxelColor);
	// Octree
	rootMeshOctree.visible = parameters.octreeVisible;
	// Wireframe
	for (var m = 0; m < rootMeshOctree.material.materials.length; m++) {
		rootMeshOctree.material.materials[m].wireframe = parameters.octreeWire;
	}
	// User color
	rootMeshOctree.material.materials[0].color = new THREE.Color(parameters.octreeColor);
	// Material of Empty octree
	rootMeshOctree.material.materials[1].visible = parameters.octreeShowEmpty;
}

function updateScale()
{
	model.scale.set(parameters.modelScale, parameters.modelScale, parameters.modelScale);

	if (parameters.voxelAutoUpdate) {
		reparseVoxels();
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Voxel Handlers 

function updateVoxel()
{
    model.geometry.computeBoundingBox();
    var bounds = model.geometry.boundingBox;
    var vertices = model.geometry.vertices.clone();
    var faces = model.geometry.faces.clone();
	var meshSize = new THREE.Vector3(
		(bounds.max.x - bounds.min.x) * parameters.modelScale,
		(bounds.max.y - bounds.min.y) * parameters.modelScale,
		(bounds.max.z - bounds.min.z) * parameters.modelScale);
	var dimensionMax = Math.max(Math.ceil(meshSize.x/2), Math.max(Math.ceil(meshSize.y/2), Math.ceil(meshSize.z/2)));
	
	var n = dimensionMax;
	n+=(n==0);
	n--;
	n|=n>>1;
	n|=n>>2;
	n|=n>>4;
	n|=n>>8;
	n|=n>>16;
	n++;
	dimensionMax = n;

	var position = { x:0, y:0, z:0 };
	
	// Octree
	octree = new Octree(position, {x:dimensionMax, y:dimensionMax, z:dimensionMax});

	// Voxels
	parseVoxel(vertices, faces, meshSize, parameters.modelScale);
}

function reparseVoxels()
{
	ResetRootGeometryVoxel();
	updateVoxel();
	UpdateRootGeometryVoxel();
}

function ResetRootGeometryVoxel()
{
	rootGeometryVoxel.dispose();
	rootGeometryVoxel = new THREE.Geometry();
	scene.remove( rootMeshVoxel );	
}

function UpdateRootGeometryVoxel()
{
	rootGeometryVoxel.computeFaceNormals();
	rootMeshVoxel = new THREE.Mesh( rootGeometryVoxel, new THREE.MeshFaceMaterial( materials ));
	rootMeshVoxel.matrixAutoUpdate = false;
	rootMeshVoxel.updateMatrix();
	scene.add( rootMeshVoxel );	
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Octree Handlers 

function updateLOD()
{
	ResetRootGeometryOctree();
	// IterateOctree(octree, parameters.octreeLOD);
	ExploreOctree(octree, camera.position);
	UpdateRootGeometryOctree();
}

function ResetRootGeometryOctree()
{
	rootGeometryOctree.dispose();
	rootGeometryOctree = new THREE.Geometry();
	scene.remove( rootMeshOctree );	
}

function UpdateRootGeometryOctree()
{
	rootGeometryOctree.computeFaceNormals();
	rootMeshOctree = new THREE.Mesh( rootGeometryOctree, new THREE.MeshFaceMaterial( materialsOctree ));
	rootMeshOctree.matrixAutoUpdate = false;
	rootMeshOctree.updateMatrix();
	scene.add( rootMeshOctree );	
}

function IterateOctree(octreeRoot, count) {
	var color = new THREE.Color(1,0,0);
	var dimension = {
		x: octreeRoot.halfDimension.x * 2,
		y: octreeRoot.halfDimension.y * 2,
		z: octreeRoot.halfDimension.z * 2};

	// Reached level of details or minimum size
	if (count == 0 || octreeRoot.halfDimension.x <= 0.5) {
		if (octreeRoot.hasChildren() || octreeRoot.data != undefined) {
			AddCubeOctree(octreeRoot.origin, dimension, 0);
		}
		// Show empty
		else if (parameters.octreeShowEmpty) {
			AddCubeOctree(octreeRoot.origin, dimension, 1);
		}
	} else {
		// Octree Node has children
		if (octreeRoot.hasChildren()) {
			// Octree Node has 8 children with data in each
			if (octreeRoot.hasAllChildren()) {
				AddCubeOctree(octreeRoot.origin, dimension, 0);
			}
			// Iterate each children
			else {
				for (var i = 0; i < 8; ++i) {
					var octreeChild = octreeRoot.children[i];
					dimension = {
						x: octreeChild.halfDimension.x * 2,
						y: octreeChild.halfDimension.y * 2,
						z: octreeChild.halfDimension.z * 2};
					// If we have reach level of details
					if (count == 0) {
						// If octree node has children or has data
						if (octreeChild.hasChildren() || octreeChild.data != undefined) {
							AddCubeOctree(octreeChild.origin, dimension, 0);
						}
						// Show empty
						else if (parameters.octreeShowEmpty) {
							AddCubeOctree(octreeChild.origin, dimension, 1);
						}
					// Iterate more level of details
					} else {
						IterateOctree(octreeChild, count - 1);
					}
				}
			}
		}
		// Octree Node is a leaf and got data
		else if (octreeRoot.data != undefined) {

			//
			// var i = octreeRoot.getOctantContainingPoint(point);
			octreeRoot.split();
			for (var i = 0; i < 8; ++i) {
				var octreeChild = octreeRoot.children[i];
				IterateOctree(octreeChild, count - 1);
			}
		}
		// Show empty
		else if (parameters.octreeShowEmpty) {
			AddCubeOctree(octreeRoot.origin, dimension, 1);
		}
	}
}

function ExploreOctree(octreeRoot, position) {
	var color = new THREE.Color(1,0,0);
	var dimension = {
		x: octreeRoot.halfDimension.x * 2,
		y: octreeRoot.halfDimension.y * 2,
		z: octreeRoot.halfDimension.z * 2};
	var distance = distanceBetween(position, octreeRoot.origin) * 0.01;

	// Reached level of details or minimum size
	if (distance > octreeRoot.halfDimension.x || octreeRoot.halfDimension.x <= 0.5) {
		if (octreeRoot.hasChildren() || octreeRoot.data != undefined) {
			AddCubeOctree(octreeRoot.origin, dimension, 0);
		}
	} else {
		// Octree Node has children
		if (octreeRoot.hasChildren()) {
			// Octree Node has 8 children with data in each
			if (octreeRoot.hasAllChildren()) {
				AddCubeOctree(octreeRoot.origin, dimension, 0);
			}
			// Iterate each children
			else {
				for (var i = 0; i < 8; ++i) {
					var octreeChild = octreeRoot.children[i];
					dimension = {
						x: octreeChild.halfDimension.x * 2,
						y: octreeChild.halfDimension.y * 2,
						z: octreeChild.halfDimension.z * 2};
					distance = distanceBetween(position, octreeChild.origin) * 0.1;
					// If we have reach level of details
					if (distance > octreeChild.halfDimension.x) {
						// If octree node has children or has data
						if (octreeChild.hasChildren() || octreeChild.data != undefined) {
							AddCubeOctree(octreeChild.origin, dimension, 0);
						}
					// Iterate more level of details
					} else {
						ExploreOctree(octreeChild, position);
					}
				}
			}
		}
		// Octree Node is a leaf and got data
		// else if (octreeRoot.data != undefined) {

		// 	//
		// 	// var i = octreeRoot.getOctantContainingPoint(point);
		// 	octreeRoot.split();
		// 	for (var i = 0; i < 8; ++i) {
		// 		var octreeChild = octreeRoot.children[i];
		// 		ExploreOctree(octreeChild, position);
		// 	}
		// }
	}
}