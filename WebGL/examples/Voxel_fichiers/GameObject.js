


GameObject = function () 
{
	this.scale = 2;

	this.voxels = [];
	this.mesh;
	this.particleSystem;
	
	this.rotation = new THREE.Vector3();
	this.position = new THREE.Vector3();

	this.areaNear = 60;
	this.areaFar = 200;

	this.freeze = false;

	this.blackAndWhite = true;
	this.sizeFactor = 2;

	this.color;

	this.setSizeFactor = function (size)
	{
		this.sizeFactor = size;
		if (this.particleSystem != undefined) {
			this.particleSystem.material.size = this.scale * size;
		}
	}

	this.moveTo = function (position)
	{
		this.position.set(Math.floor(position.x), Math.floor(position.y), Math.floor(position.z));
		if (this.particleSystem != undefined) {
			this.particleSystem.position = this.position;
		}	
	};

	this.rotateTo = function (rotation) 
	{
		this.rotation.set(rotation.x, rotation.y, rotation.z)
	};

	this.nearestVoxelFrom = function (position)
	{
		var min = 100000, dist = 0, nearest = 0;
		for (var i = 0; i < this.voxels.length; i++) {
			dist = distance(position, this.voxels[i]);
			if (min > dist) {
				min = dist;
				nearest = i;
			}
		}
		return nearest;
	}

	this.initWithMesh = function (mesh, scale, unit) 
	{
		// Setup voxels
		this.mesh = mesh;
		if (unit == undefined) {
			unit = 1;
		}
		this.voxels = getVoxelsFromMesh(this.mesh.geometry.vertices, this.mesh.geometry.faces, scale, unit);
		this.cleanVoxels();
		//this.fillVoxels();
		//this.cleanVoxels();
		// Setup particles
		this.particleSystem = initParticleSystem(this.voxels, this.scale, this.scale * this.sizeFactor, this.color);
	};

	this.initWithMeshWithCubes = function (mesh, scale, unit) 
	{
		this.mesh = mesh;
		if (unit == undefined) {
			unit = 1;
		}
		this.voxels = getVoxelsFromMesh(this.mesh.geometry.vertices, this.mesh.geometry.faces, scale, unit);
		this.cleanVoxels();

		for (var i = 0; i < this.voxels.length; ++i) {
			makeCube(this.voxels[i]);
		}
	};

	this.cleanVoxels = function ()
	{
		for (var i = 0; i < this.voxels.length; ++i) {
			var voxel = this.voxels[i];
			for (var j = i+1; j < this.voxels.length; ++j) {
				var vox = this.voxels[j];
				if (voxel.x == vox.x && voxel.y == vox.y && voxel.z == vox.z)
					this.voxels.splice(j, 1);
			}
		}
	};

	this.fillVoxels = function ()
	{
		this.freeze = true;
		var lines = [];
		for (var i = 0; i < this.voxels.length; ++i) {
			var voxel = this.voxels[i];
			for (var j = i+1; j < this.voxels.length; ++j) {
				var vox = this.voxels[j];
				if (voxel.x == vox.x && voxel.y == vox.y) {
					if (voxel.z - vox.z > 2) {
						var line = drawLine(voxel, vox, {x:Math.random(), y:Math.random(), z:Math.random()});
						lines.push.apply(lines, line);
					}
				}
			}
		}
		this.voxels.push.apply(this.voxels, lines);
		if (this.particleSystem != undefined) {
			this.particleSystem.geometry.attributes.position.array = new Float32Array(this.voxels.length * 3);
			this.particleSystem.geometry.attributes.position.array.needsUpdate = true;
			this.particleSystem.geometry.attributes.position.needsUpdate = true;
			this.particleSystem.geometry.attributes.color.array = new Float32Array(this.voxels.length * 3);
			this.particleSystem.geometry.attributes.color.array.needsUpdate = true;
			this.particleSystem.geometry.attributes.color.needsUpdate = true;
			this.particleSystem.geometry.buffersNeedUpdate=true;
		}
		this.freeze = false;
		this.updateParticleSystem(camera.position);
	}

	this.updateScaleFromPosition = function (position)
	{
		var dist = Math.max(0.01, (this.areaFar - distance(this.position, position)));
		var areaRatio = Math.max(0.01, Math.min(dist / (this.areaFar - this.areaNear), 1));
		return areaRatio * this.scale;
	};

	this.updateParticleSystem = function (position)
	{
		if (!this.freeze && this.particleSystem != undefined) {

			var scale = this.scale;
			if (position != undefined) {
				scale = this.updateScaleFromPosition(position);
			}

			var positions = this.particleSystem.geometry.attributes.position.array;
			var colors = this.particleSystem.geometry.attributes.color.array;

			var iV = 0;
			var color = new THREE.Color();
			for ( var i = 0; i < positions.length && iV < this.voxels.length; i += 3 ) {

				var v = this.voxels[iV];
				++iV;

				var p = new THREE.Vector3(v.x, v.y, v.z);

				p.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.rotation.x);
				p.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
				p.applyAxisAngle(new THREE.Vector3(0, 0, 1), this.rotation.z);

				positions[ i ]     = Math.floor(p.x * scale);
				positions[ i + 1 ] = Math.floor(p.y * scale);
				positions[ i + 2 ] = Math.floor(p.z * scale);

				var light = (v.n.x + v.n.y + v.n.z) * 0.333;
				if (this.color != undefined) {
					color.setRGB(light + this.color.r, light + this.color.g, light + this.color.b);
				} else if (this.blackAndWhite) {
					color.setRGB(light, light, light);
				} else {	
					color.setRGB(v.n.x, v.n.y, v.n.z);
				}

				colors[ i ]     = color.r;
				colors[ i + 1 ] = color.g;
				colors[ i + 2 ] = color.b;
			}


			positions.needsUpdate = true;
			this.particleSystem.geometry.buffersNeedUpdate=true;
			this.particleSystem.geometry.verticesNeedUpdate=true;
			this.particleSystem.geometry.attributes.position.needsUpdate = true;
		}
	};

	this.getIndexFromPosition = function (position) {
		return Math.floor((position.x
						 + position.y * this.gridSize
						 + position.z * this.gridSize * this.gridSize) / this.scale);
	};

	this.isVoxelHere = function (position, aproximation)
	{
		var result = [];
		var vX, vY, vZ, pX, pY, pZ;
		for (var i = 0; i < this.voxels.length; i++) {
			vX = Math.floor((this.position.x + this.voxels[i].x * this.scale) * aproximation);
			vY = Math.floor((this.position.y + this.voxels[i].y * this.scale) * aproximation);
			vZ = Math.floor((this.position.z + this.voxels[i].z * this.scale) * aproximation);
			pX = Math.floor(position.x * aproximation);
			pY = Math.floor(position.y * aproximation);
			pZ = Math.floor(position.z * aproximation);

			if (vX == pX && vY == pY && vZ == pZ) {
				result.push(i);
			}
		}
		return result;
	};

	this.eraseVoxels = function (indexes)
	{
		this.freeze = true;
		for (var i = 0; i < indexes.length; i++) {
			var index = indexes[i];
			if (index >= 0 && index < this.voxels.length) {
				this.voxels.splice(index, 1);
			}
		}
		this.particleSystem.geometry.attributes.position.array = new Float32Array(this.voxels.length * 3);
		this.particleSystem.geometry.attributes.position.array.needsUpdate = true;
		this.particleSystem.geometry.attributes.position.needsUpdate = true;
		this.particleSystem.geometry.attributes.color.array = new Float32Array(this.voxels.length * 3);
		this.particleSystem.geometry.attributes.color.array.needsUpdate = true;
		this.particleSystem.geometry.attributes.color.needsUpdate = true;
		this.particleSystem.geometry.buffersNeedUpdate=true;
		this.freeze = false;
		this.updateParticleSystem(camera.position);
	};

}