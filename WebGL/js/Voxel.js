// Voxel Element
Engine.Voxel = function (voxelIndex_, voxelPosition_, voxelNormal_) 
{
    this.index = voxelIndex_;
    this.position = voxelPosition_;
    this.normal = voxelNormal_;
    this.materialIndex = 0;
};

// Voxel Manager
Engine.VoxelManager = function()
{
    this.voxels;
    this.grid;
    this.grids;
    this.meshVoxel;
    this.geometryVoxel;
    this.dimension;
    
    this.Init = function()
    {
        // Data
        this.voxels = [];
        this.grids = [];
        
        // Geometry
        this.geometryVoxel = new THREE.Geometry();
        this.meshVoxel = new THREE.Mesh(this.geometryVoxel, Engine.Materials.voxelMultiMaterials);
        this.dimension = new THREE.Vector3();

        // Array list representing height grid 3D
        // One for each octant
        // Allows to use unique id from 3d position
        for (var g = 0; g < 8; ++g) {
            var grid = new Array(Math.ceil(Engine.MaxBounds.x * Engine.MaxBounds.y * Engine.MaxBounds.z));
            this.grids.push(grid);
        }
    };
    
    this.Clear = function()
    {
        // Clear Geometry
        this.geometryVoxel.dispose();
        this.geometryVoxel = new THREE.Geometry();
        Engine.scene.remove( this.meshVoxel );
        
        // Clear Data
        this.voxels = [];
        this.grids = [];
        for (var g = 0; g < 8; ++g) {
            var grid = new Array(Math.ceil(Engine.MaxBounds.x * Engine.MaxBounds.y * Engine.MaxBounds.z));
            this.grids.push(grid);
        }
    };
    
    this.GetPosition = function()
    {
        var bounds = this.geometryVoxel.boundingBox;
        return bounds.min.clone().add(bounds.max).divideScalar(2).round();
    };
    
    this.GetDimension = function()
    {
        var bounds = this.geometryVoxel.boundingBox;
        return bounds.max.clone().sub(bounds.min);
    };
    
    this.GetGridFromPosition = function(position_)
    {  
        var oct = 0;
		if(position_.x >= 0) oct |= 4;
		if(position_.y >= 0) oct |= 2;
		if(position_.z >= 0) oct |= 1;
		return oct;
    };
    
    this.GridPosition = function(position_)
    {
        var position = position_.clone();
        
        return position.sub({x:0.5, y:0.5, z:0.5}).round();
    };
    
    this.GetIndexFromPosition = function(position)
    {   
        // Get grid index from position
        return Math.round(
            Math.abs(position.x)
            + Math.abs(position.z) * Engine.MaxBounds.x
            + Math.abs(position.y) * (Engine.MaxBounds.x * Engine.MaxBounds.z));
        
        // Get index from position
        round ( x + y * (sizeX * sizeZ) + z * sizeX )
        
        // Get position from index
        x = index % sizeX
        y = floor ( index / ( sizeX * sizeZ ) ) % sizeY
        z = floor ( index / sizeX ) % sizeZ
        
    };
    
    this.SubVoxelAt = function(position_)
    {
        var position = position_.clone().sub({x:0.5, y:0.5, z:0.5}).round();
        var index = this.GetIndexFromPosition(position);
        var gridIndex = this.GetGridFromPosition(position);
        
        if (gridIndex < Engine.MaxLength)
        {
            var voxel = this.grids[gridIndex][index];

            if (voxel instanceof Engine.Voxel)
            {
                this.voxels[this.voxels.indexOf(this.grids[gridIndex][index])] = {};
                this.grids[gridIndex][index] = {};

                this.UpdateVoxels();
            }
        }
    };
    
    // 
    this.AddVoxelAt = function(position_)
    {   
        var position = position_.clone().sub({x:0.5, y:0.5, z:0.5}).round();
        var index = this.GetIndexFromPosition(position);        
        var gridIndex = this.GetGridFromPosition(position);
        
        // Clean
        var geometrySave = this.geometryVoxel.clone();
        this.geometryVoxel = new THREE.Geometry();
        Engine.scene.remove( this.meshVoxel );
        
        this.geometryVoxel = geometrySave;
        
        if (gridIndex < Engine.MaxLength)
        {
            var voxel = this.grids[gridIndex][index];

            if (voxel == undefined)
            {
                voxel = new Engine.Voxel(index, position, {x:0, y:0, z:0});
                this.voxels.push(voxel);
                this.grids[gridIndex][index] = voxel;
                
                this.AddVoxel(position, 0);
            }
        }
        
        this.UpdateGeometry();
    };
    
    // Dynamic Construction Process
    this.BuildVoxels = function()
    {
        for (var v = 0; v < this.voxels.length; ++v) {
            var voxel = this.voxels[v];
            if (voxel instanceof Engine.Voxel) {
                this.AddVoxel(voxel.position, voxel.materialIndex);
            }
        }
        
        /* TEST INDEX POSITION (Not optimal, use for debug) */
        
//        var size = Engine.MaxBounds;
//        for (var g = 0; g < 8; ++g) {
//            var grid = this.grids[g];
//            for (var v = 0; v < grid.length; ++v) {
//                var voxel = grid[v];
//                if (voxel != undefined) {
//                    var pos = {
//                        x: v % size.x, 
//                        y:Math.floor(v/(size.x*size.z))%size.y, 
//                        z: Math.floor(v/size.x)%size.z};
//                    //
//                    if (g < 4) { pos.x *= -1; }
//                    if (g < 2 || g == 4 || g == 5) { pos.y *= -1; }
//                    if (g % 2 == 0) { pos.z *= -1; }
//                    this.AddVoxel(pos, 0);
//                }
//            }
//        }
    };
    
    this.CleanGeometry = function()
    {
        this.geometryVoxel.dispose();
        this.geometryVoxel = new THREE.Geometry();
        Engine.scene.remove( this.meshVoxel );
    };
    
    this.UpdateVoxels = function()
    {
        this.CleanGeometry();

        // Voxelize
        this.BuildVoxels();
        Engine.Parameters.voxelCount = "" + this.voxels.length;
        
        this.UpdateGeometry();
    };
    
    this.UpdateGeometry = function()
    {
        this.geometryVoxel.computeFaceNormals();
        this.geometryVoxel.computeBoundingBox();
        var bounds = this.geometryVoxel.boundingBox;
        this.dimension = (bounds.max).sub(bounds.min);
        this.meshVoxel = new THREE.Mesh( this.geometryVoxel, Engine.Materials.voxel);
        this.meshVoxel.matrixAutoUpdate = false;
        this.meshVoxel.updateMatrix();
        this.UpdateDisplay();
        Engine.scene.add( this.meshVoxel );	
    };
    
    // Update current model
    this.UpdateModel = function()
    {
        this.UpdateWithModel(Engine.modelManager.GetModel());
    };
    
    // Voxel Construction Process
    this.UpdateWithModel = function(model_)
    {
        this.CleanGeometry();
        
        // Voxelize
        this.VoxelizeModel(model_);
        this.BuildVoxels();
        Engine.Parameters.voxelCount = "" + this.voxels.length;
        
        this.UpdateGeometry();
    };
    
    // Add geometry
    this.AddVoxel = function(position, materialIndex)
    {
        var cube = new THREE.Mesh( Engine.BoxGeometry );
        cube.position.set(
            position.x + 0.5,
            position.y + 0.5,
            position.z + 0.5);
        cube.updateMatrix();
        this.geometryVoxel.merge(cube.geometry, cube.matrix, materialIndex);
//        this.meshVoxel.geometry.merge(cube.geometry, cube.matrix, materialIndex);
    };
    
    // Material
    this.UpdateDisplay = function()
    {
        // Visibility
        this.meshVoxel.visible = Engine.Parameters.voxelVisible;
        
        // Color Normal
        if (Engine.Parameters.voxelColorNormal) {
            this.meshVoxel.material = Engine.Materials.normal;
        } 
        // Color User
        else {
            this.meshVoxel.material = Engine.Materials.voxel;
            this.meshVoxel.material.color = new THREE.Color(Engine.Parameters.voxelColor);
        }
        
        // Wireframe
        this.meshVoxel.material.wireframe = Engine.Parameters.voxelWire;
    };

    // Parse Voxel
    this.VoxelizeModel = function(model)
    {        
        // Lists of vertices and triangles
        var vertices = model.mesh.geometry.vertices.clone();
        var triangles = model.mesh.geometry.faces.clone();
        var trianglesCount = triangles.length;

        // For each triangles
        for (var t = 0; t < trianglesCount; t++) {

            // Triangle's vertices position
            var face3 = triangles[t];
            var a = vertices[face3.a].clone().multiplyScalar(Engine.Parameters.modelScale);//.add(model.sizeHalf);
            var b = vertices[face3.b].clone().multiplyScalar(Engine.Parameters.modelScale);//.add(model.sizeHalf);
            var c = vertices[face3.c].clone().multiplyScalar(Engine.Parameters.modelScale);//.add(model.sizeHalf);

            // Triangle
            var triangle = new Engine.Triangle(a, b, c);

            // For each voxel in bounds
            var gridCount = (triangle.size.x * triangle.size.y * triangle.size.z);
            for (var v = 0; v < gridCount; ++v)
            {
                // Position in triangle grid
                var x = v % triangle.size.x;
                var y = Math.floor( v / (triangle.size.x * triangle.size.z )) % triangle.size.y;
                var z = Math.floor( v / triangle.size.x ) % triangle.size.z;

                // 
                var gridPosition = new Engine.Vector3();
                gridPosition.x = triangle.min.x + x;
                gridPosition.y = triangle.min.y + y;
                gridPosition.z = triangle.min.z + z;

                // Unique ID by position
                var voxelIndex = Math.floor(
                    Math.abs(gridPosition.x) % Engine.MaxBounds.x
                    + Math.abs(gridPosition.z) * Engine.MaxBounds.x
                    + Math.abs(gridPosition.y) * (Engine.MaxBounds.x * Engine.MaxBounds.z));
                /*if (gridIndex < 0) {
                    console.log(gridIndex);
                    console.log(gridPosition);
                }*/
                
                var gridIndex = this.GetGridFromPosition(gridPosition);
                
                var gridUnit = this.grids[gridIndex][voxelIndex];
                if (gridUnit == undefined)
                {
                    // Intersection test
                    var voxelBoundsCenter = { 
                        x:gridPosition.x + 0.5, 
                        y:gridPosition.y + 0.5, 
                        z:gridPosition.z + 0.5 };
                    var voxelBoundsDimension = { x:0.5, y:0.5, z:0.5 };
                    if (0 != triBoxOverlap(voxelBoundsCenter, voxelBoundsDimension, triangle))
                    {
                        // Voxel position
                        var pos = new THREE.Vector3(
                            gridPosition.x,
                            gridPosition.y,
                            gridPosition.z);

                        // Create voxel
                        var voxel = new Engine.Voxel(voxelIndex, pos, triangle.normal);

                        // Define the position (no duplicate)
                        this.grids[gridIndex][voxelIndex] = voxel;

                        // For optimizing iterations
    					this.voxels.push(voxel);
                    }
                }
            }
        }
        
        // Fill Surfaces
        if (Engine.Parameters.solidify)
        {
            var current = -1;
            var columns = [];
            var size = model.size;
            // The first slice of the grid
            var sliceCount = (size.x * size.z);
            for (var s = 0; s < sliceCount; ++s) {
                var positionX = s % size.x;
                var positionZ = Math.floor(s / size.x) % size.z;
                current = -1;
                columns = [];
                // For each colum of the voxel picked from slice
                for (var positionY = 0; positionY < size.y; ++positionY)
                {
                    var pos = new THREE.Vector3(
                        positionX - model.sizeHalf.x,
                        positionY - model.sizeHalf.y,
                        positionZ - model.sizeHalf.z);
                    pos.round();
                    var gridIndex = this.GetGridFromPosition(pos);
                    var voxelIndex = this.GetIndexFromPosition(pos);
                    
                    var voxel = this.grids[gridIndex][voxelIndex];
                    if (voxel instanceof Engine.Voxel ) {
                        // Grab it
                        columns.push(voxel);
                    }
                }
                if (columns.length > 1) {
                    for (var c = 0; c < columns.length; ++c) {
                        var currentVoxel = columns[c];
                         if (currentVoxel.normal.y <= 0 && currentVoxel == -1) {
                                current = c;
                        // 	current = voxel.index;
                         } else if (currentVoxel.normal.y > 0 && current != -1) {
                                var pastVoxel = columns[current];
                                if (pastVoxel != undefined) {
                                    for (var positionY = pastVoxel.position.y + 1; positionY < currentVoxel.position.y; ++positionY)
                                    {
                                        var pos = new THREE.Vector3(
                                            positionX - model.sizeHalf.x,
                                            positionY,
                                            positionZ - model.sizeHalf.z);
                                        pos.round();
                                        var gridIndex = this.GetGridFromPosition(pos);
                                        var voxelIndex = this.GetIndexFromPosition(pos);

                                        var voxel = this.grids[gridIndex][voxelIndex];
                                        if (voxel == undefined )
                                        {
                                            // Create voxel
                                            var voxel = new Engine.Voxel(voxelIndex, pos, new Engine.Vector3(0,0,0));

                                            // Define the position (no duplicate)
                                            this.grids[gridIndex][voxelIndex] = voxel;

                                            // For optimizing iterations
                                            this.voxels.push(voxel);
                                        }
                                    }
                                    current = -1;
                                }
                         }
                    }
                }
            }
        }
    };
};