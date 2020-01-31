
// PointCloud with Custom, Dynamic Attribute
var renderer, scene, camera, controls, wireframes;

init();
animate();

// init demo
function init() {

    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x2244aa, 1 )
    document.body.appendChild( renderer.domElement );
    
    // scene
    scene = new THREE.Scene();

    // show grid
    var gridHelper = new THREE.GridHelper( 100, 100 );
    scene.add( gridHelper );    

    // camera
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 100;
    camera.position.y = 100;
    camera.lookAt(new THREE.Vector3(0,0,0));

    // get preview model
    var useTexture = localStorage.getItem("voxelator_use_texture") === "true";
    var modelData = localStorage.getItem("voxelator_preview_model");
    var textureData = localStorage.getItem("voxelator_preview_texture");
    var modelType = localStorage.getItem("voxelator_model_type");

    // get mesh from loaded scene
    var getMeshFromScene = (scene, callback) =>
    {
        scene.traverse( ( child ) => {
            if ( child.isMesh ) {
                return callback(child);
            }
        });
    }

    // should we enable lighting?
    var enableLights = true;

    // create a loder based on model type
    var loader; 
    var loadMethod;
    switch (modelType)
    {
        case ".gltf":
            loader = new THREE.GLTFLoader();
            loadMethod = (callback) => {
                loader.parse(modelData, '', (loaded) => {
                    getMeshFromScene(loaded.scene, callback);
                });
            };
            break;

        case ".ply":
            loader = new THREE.PLYLoader();
            loadMethod = (callback) => {
                var geometry = loader.parse(modelData);
                var mesh = new THREE.Mesh(geometry);
                callback(mesh);
            };
            break;

        case ".dae":
            loader = new THREE.ColladaLoader();
            loadMethod = (callback) => {
                var loaded = loader.parse(modelData);
                getMeshFromScene(loaded.scene, callback);
            };
            break;
     
        case ".obj":
            loader = new THREE.OBJLoader();
            loadMethod = (callback) => {
                scene = loader.parse(modelData);
                var mesh = scene.children[0];
                callback(mesh);
            };
            enableLights = false;
            break;

        case ".stl": // CURRENTLY NOT WORKING.
            loader = new THREE.STLLoader();
            loadMethod = (callback) => {
                var loaded = loader.parse(modelData);
                getMeshFromScene(loaded.scene, callback);
            };
            break;
            
        default:
            throw new Error("Unknown model type!");
    }
    
    // wireframes list
    wireframes = [];

    // load model to render
    loadMethod(( mesh ) => {
    
        // centerize object
        mesh.geometry.center();

        // add wireframe
        var wireframe = new THREE.WireframeGeometry( mesh.geometry );
        var line = new THREE.LineSegments( wireframe );
        line.material.opacity = 0.25;
        line.material.transparent = true;
        scene.add( line );
    
        // add to camera
        scene.add( mesh );

        // set camera position and grid
        var bbox = new THREE.Box3().setFromObject(mesh);
        camera.position.set(bbox.max.x+15, bbox.max.y+15, bbox.max.z+15);
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.update();
        gridHelper.position.y = bbox.min.y;

        // set texture
        if (useTexture) {
            var image = new Image();  
            var texture = new THREE.Texture();
            texture.minFilter = texture.magFilter = THREE.NearestFilter;
            image.onload = (e) => {
                texture.image = image;
                texture.needsUpdate = true;
                mesh.material = new (enableLights ? THREE.MeshLambertMaterial : THREE.MeshBasicMaterial)({map: texture});
                mesh.material.polygonOffset = true;
                mesh.material.polygonOffsetFactor = 1;
                mesh.material.polygonOffsetUnits = 1;
            };
            image.src = textureData;
        }
        // set vertex color
        else {
            mesh.material = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors});
        }
    });

    // set directional lighting
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.position.set(0.25, 1, 0.4);
    scene.add( directionalLight );
    
    // add secondary directional light
    directionalLight = new THREE.DirectionalLight( 0xacacac, 0.45 );
    directionalLight.position.set(1, -0.1, 0.15);
    scene.add( directionalLight );

    // set ambient lighting
    var light = new THREE.AmbientLight( 0x555555 );
    scene.add( light );

    // resize renderer and canvas when window resizes.
    var onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
    window.addEventListener( 'resize', onWindowResize, false );
}

// animation main loop
function animate() {

    requestAnimationFrame( animate );
    render();

}

// update controls and redraw scene
function render() {
    if (controls) { controls.update(); }
    renderer.render( scene, camera );
}