
// =====================================================
var gl;

// =====================================================
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var rotMatrix = mat4.create();
var distCENTER;
// =====================================================

var OBJ1 = null;
var PLANE = null;
var SKYBOX = null;


// =====================================================
// OBJET 3D, lecture fichier obj
// =====================================================

class objmesh {

	// --------------------------------------------
	constructor(objFname) {
		this.objName = objFname;
		this.shaderName = 'obj';
		this.loaded = -1;
		this.shader = null;
		this.mesh = null;
		
		loadObjFile(this);
		loadShaders(this);
	}

	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.nAttrib = gl.getAttribLocation(this.shader, "aVertexNormal");
		gl.enableVertexAttribArray(this.shader.nAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.vertexAttribPointer(this.shader.nAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");

		this.shader.srcPosXY = gl.getUniformLocation(this.shader, "uSRCposXY");
		this.shader.srcPosZ = gl.getUniformLocation(this.shader, "uSRCposZ");
		this.shader.srcPow = gl.getUniformLocation(this.shader, "uSRCpow");
		this.shader.kd = gl.getUniformLocation(this.shader, "uSRCcol");
		this.shader.modele = gl.getUniformLocation(this.shader, "uModele");
		this.shader.OBJcol = gl.getUniformLocation(this.shader, "uOBJcol");
		this.shader.rugosite = gl.getUniformLocation(this.shader, "uRugosite");
		this.shader.coeffDiffus = gl.getUniformLocation(this.shader, "uCoeffDiffus");
		this.shader.coeffSpeculaire = gl.getUniformLocation(this.shader, "uCoeffSpeculaire");
		this.shader.indiceMilieu = gl.getUniformLocation(this.shader, "uIndiceMilieu");
		this.shader.n = gl.getUniformLocation(this.shader, "uPuissanceN");

		this.shader.sampler0 = gl.getUniformLocation(this.shader, "uSampler0");
		this.shader.sampler1 = gl.getUniformLocation(this.shader, "uSampler1");
		this.shader.sampler2 = gl.getUniformLocation(this.shader, "uSampler2");
		this.shader.sampler3 = gl.getUniformLocation(this.shader, "uSampler3");
		this.shader.sampler4 = gl.getUniformLocation(this.shader, "uSampler4");
		this.shader.sampler5 = gl.getUniformLocation(this.shader, "uSampler5");
		this.shader.transparent = gl.getUniformLocation(this.shader, "uTransparent");
		this.shader.mirroir = gl.getUniformLocation(this.shader, "uMirroir");
	}
	
	// --------------------------------------------
	setMatrixUniforms() {
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, rotMatrix);
		gl.uniformMatrix4fv(this.shader.rMatrixUniform, false, rotMatrix);
		gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
		gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
	}

	// --------------------------------------------
	setVec3fUniforms(){
		// Source https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb transforme les couleur hexadecimales en RGB
		function hexToRgb(hex) {
		  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		  return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		  } : null;
		}

		// Definition de l'objet
		var couleurObjet = document.getElementById("couleurObjet").value;

		// Definition de la source lumineuse
		var couleurLumiere = document.getElementById("couleurLumiere").value;
		var puissanceLumiere = document.getElementById("puissanceLumiere").value;

		gl.uniform3fv(this.shader.srcPow, [puissanceLumiere, puissanceLumiere, puissanceLumiere]);
		gl.uniform3fv(this.shader.OBJcol, [hexToRgb(couleurObjet).r / 255.0, hexToRgb(couleurObjet).g / 255.0, hexToRgb(couleurObjet).b / 255.0]);
		gl.uniform3fv(this.shader.kd, [hexToRgb(couleurLumiere).r / 255.0, hexToRgb(couleurLumiere).g / 255.0, hexToRgb(couleurLumiere).b / 255.0]);


		// Positionnement de la lumiere XY pour le deplacement avec la souris et Alt et Z pour le slider
		var positionZLumiere = document.getElementById("positionZLumiere").value;
		if(alt){
			var positionXLumiere = (lastMouseX-300)/100;
			var positionYLumiere = -(lastMouseY-300)/100;
			
			gl.uniform2fv(this.shader.srcPosXY, [positionXLumiere, positionYLumiere]);

			alt = false;
		}
		gl.uniform1f(this.shader.srcPosZ, positionZLumiere);
	}

	setFloatIntUniforms(){
		var modele;
		if(document.getElementById("Lambert").checked){
			modele = 0;
		} else if(document.getElementById("PhongModifie").checked){
			modele = 1;
		} else if(document.getElementById("Cook-TorranceBeckmann").checked){
			modele = 2;
		} else if(document.getElementById("Cook-TorranceGGX").checked){
			modele = 3;
		} else if(document.getElementById("UtilisationSkybox").checked){
			modele = 4;
		}

		var rugosite = document.getElementById("Rugosite").value;

		var coeffDiffus = document.getElementById("coeffDiffus").value;
		var coeffSpeculaire = document.getElementById("coeffSpeculaire").value;

		var indiceMilieu;
		if(modele == 4){
			indiceMilieu = document.getElementById("IndiceMilieuSkybox").value;
		} else {
			if(document.getElementById("Verre").checked){
				indiceMilieu = document.getElementById("Verre").value;
			} else if(document.getElementById("Eau").checked){
				indiceMilieu = document.getElementById("Eau").value;
			} else if(document.getElementById("Titane").checked){
				indiceMilieu = document.getElementById("Titane").value;
			}
		}

		var n = document.getElementById("n").value;

		gl.uniform1f(this.shader.n, n);
		gl.uniform1i(this.shader.modele, modele);
		gl.uniform1f(this.shader.rugosite, rugosite);
		gl.uniform1f(this.shader.coeffSpeculaire, coeffSpeculaire);
		gl.uniform1f(this.shader.coeffDiffus, coeffDiffus);
		gl.uniform1f(this.shader.indiceMilieu, indiceMilieu);

		
		gl.uniform1i(this.shader.sampler0, 0);
		gl.uniform1i(this.shader.sampler1, 1);
		gl.uniform1i(this.shader.sampler2, 2);
		gl.uniform1i(this.shader.sampler3, 3);
		gl.uniform1i(this.shader.sampler4, 4);
		gl.uniform1i(this.shader.sampler5, 5);

		var mirroir = 0;
		var transparent = 0;
		if(document.getElementById("Transparent").checked){
			transparent = 1;
		}
		if(document.getElementById("Mirroir").checked){
			mirroir = 1;
		}
		gl.uniform1i(this.shader.transparent, transparent);
		gl.uniform1i(this.shader.mirroir, mirroir);
	}
	
	// --------------------------------------------
	draw() {
		if(this.shader && this.loaded==4 && this.mesh != null) {
			this.setShadersParams();
			this.setMatrixUniforms();
			this.setVec3fUniforms();
			this.setFloatIntUniforms();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
			gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
	}

}



// =====================================================
// PLAN 3D, Support géométrique
// =====================================================

class plane {
	
	// --------------------------------------------
	constructor() {
		this.shaderName='plane';
		this.loaded=-1;
		this.shader=null;
		this.initAll();
	}
		
	// --------------------------------------------
	initAll() {
		var size=1.0;
		var vertices = [
			-size, -size, 0.0,
			 size, -size, 0.0,
			 size, size, 0.0,
			-size, size, 0.0
		];

		var texcoords = [
			0.0,0.0,
			0.0,1.0,
			1.0,1.0,
			1.0,0.0
		];

		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = 4;

		this.tBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
		this.tBuffer.itemSize = 2;
		this.tBuffer.numItems = 4;

		loadShaders(this);
	}
	
	
	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.tAttrib = gl.getAttribLocation(this.shader, "aTexCoords");
		gl.enableVertexAttribArray(this.shader.tAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.vertexAttribPointer(this.shader.tAttrib,this.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
	}


	// --------------------------------------------
	setMatrixUniforms() {
			mat4.identity(mvMatrix);
			mat4.translate(mvMatrix, distCENTER);
			mat4.multiply(mvMatrix, rotMatrix);
			gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
			gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
	}

	// --------------------------------------------
	draw() {
		if(this.shader && this.loaded==4) {		
			this.setShadersParams();
			this.setMatrixUniforms(this);
			
			gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vBuffer.numItems);
			gl.drawArrays(gl.LINE_LOOP, 0, this.vBuffer.numItems);
		}
	}

}

// =====================================================
// SKYBOX 3D, carte d'environnement
// =====================================================
class skybox {
	
	// --------------------------------------------
	constructor() {
		this.shaderName='skybox';
		this.loaded=-1;
		this.shader=null;
		this.nbTextures = 0;
		this.textures = [];
		this.tailleSkybox = 20.0;

		this.initAll();
	}
		
	// --------------------------------------------
	initAll() {
		var size = this.tailleSkybox;
		var vertices = [
			-size, -size, size, size, -size, size, size, size, size, -size, size, size, // Haut de la boite
			-size, -size, -size, size, -size, -size, size, size, -size, -size, size, -size, // Bas de la boite
			-size, size, -size, size, size, -size, size, size, size, -size, size, size,// Devant de la boite
			-size, -size, -size, size, -size, -size, size, -size, size, -size, -size, size,// Derriere de la boite
			-size, -size, -size, -size, size, -size, -size, size, size, -size, -size, size,// Gauche de la boite
			size, -size, -size, size, size, -size, size, size, size, size, -size, size,// Droite de la boite
		];

		var texcoords = [
			0.0,1.0, 1.0,1.0, 1.0,0.0, 0.0,0.0, // Haut de la boite
			0.0,0.0, 1.0,0.0, 1.0,1.0, 0.0,1.0, // Bas de la boite
			0.0,0.0, 1.0,0.0, 1.0,1.0, 0.0,1.0, // Devant de la boite
			1.0,0.0, 0.0,0.0, 0.0,1.0, 1.0,1.0, // Derriere de la boite
			0.0,0.0, 1.0,0.0, 1.0,1.0, 0.0,1.0, // Gauche de la boite
			1.0,0.0, 0.0,0.0, 0.0,1.0, 1.0,1.0, // Droite de la boite
		];

		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = vertices.length/3;

		this.tBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
		this.tBuffer.itemSize = 2;
		this.tBuffer.numItems = texcoords.length/2;

		// Index buffer (array)
		var indices = [ 0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 14, 13, 12, 15, 14, 16, 17, 18, 16, 18, 19, 20, 22, 21, 20, 23, 22];
		this.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		this.indexBuffer.itemSize = 1;
		this.indexBuffer.numItems = indices.length;

		this.nbTextures = 0;
		this.initTextures("Textures/JardinChinois/");
		loadShaders(this);
	}

	// --------------------------------------------
	initTextures(name){
		var fichierTextures = ["pos-y.png", "neg-y.png", "pos-z.png", "neg-z.png", "neg-x.png", "pos-x.png"];

		for(var i = 0; i < fichierTextures.length; i++){
			var textureImage = new Image();
			textureImage.src = name + fichierTextures[i];
			var texture = gl.createTexture();
			texture.image = textureImage;

			this.textures.push(texture);

			texture.image.onload = () => {
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
				gl.bindTexture(gl.TEXTURE_2D, this.textures[this.nbTextures]);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textures[this.nbTextures].image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				this.nbTextures++;
			}
		}
	}
	
	
	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.tAttrib = gl.getAttribLocation(this.shader, "aTexCoords");
		gl.enableVertexAttribArray(this.shader.tAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.vertexAttribPointer(this.shader.tAttrib,this.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
		this.shader.sampler0 = gl.getUniformLocation(this.shader, "uSampler0");
		gl.uniform1i(this.shader.sampler0, 0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.textures[1]);
		this.shader.sampler1 = gl.getUniformLocation(this.shader, "uSampler1");
		gl.uniform1i(this.shader.sampler1, 1);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.textures[2]);
		this.shader.sampler2 = gl.getUniformLocation(this.shader, "uSampler2");
		gl.uniform1i(this.shader.sampler2, 2);

		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, this.textures[3]);
		this.shader.sampler3 = gl.getUniformLocation(this.shader, "uSampler3");
		gl.uniform1i(this.shader.sampler3, 3);

		gl.activeTexture(gl.TEXTURE4);
		gl.bindTexture(gl.TEXTURE_2D, this.textures[4]);
		this.shader.sampler4 = gl.getUniformLocation(this.shader, "uSampler4");
		gl.uniform1i(this.shader.sampler4, 4);

		gl.activeTexture(gl.TEXTURE5);
		gl.bindTexture(gl.TEXTURE_2D, this.textures[5]);
		this.shader.sampler5 = gl.getUniformLocation(this.shader, "uSampler5");
		gl.uniform1i(this.shader.sampler5, 5);


		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");

		this.shader.uTailleBoite = gl.getUniformLocation(this.shader, "uTailleBoite");
		gl.uniform1f(this.shader.uTailleBoite, this.tailleSkybox);
	}


	// --------------------------------------------
	setMatrixUniforms() {
			mat4.identity(mvMatrix);
			mat4.translate(mvMatrix, distCENTER);
			mat4.multiply(mvMatrix, rotMatrix);
			gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
			gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
	}

	// --------------------------------------------
	draw() {
		if(this.shader && this.loaded == 4 && this.nbTextures == 6) {		
			this.setShadersParams();
			this.setMatrixUniforms(this);
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			gl.drawElements(gl.TRIANGLES, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
	}

}


// =====================================================
// FONCTIONS GENERALES, INITIALISATIONS
// =====================================================



// =====================================================
function initGL(canvas)
{
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		gl.viewport(0, 0, canvas.width, canvas.height);

		gl.clearColor(0.7, 0.7, 0.7, 1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK); 
	} catch (e) {}
	if (!gl) {
		console.log("Could not initialise WebGL");
	}
}


// =====================================================
loadObjFile = function(OBJ3D)
{
	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			var tmpMesh = new OBJ.Mesh(xhttp.responseText);
			OBJ.initMeshBuffers(gl,tmpMesh);
			OBJ3D.mesh=tmpMesh;
		}
	}

	xhttp.open("GET", "../Models/" + OBJ3D.objName, true);
	xhttp.send();
}



// =====================================================
function loadShaders(Obj3D) {
	loadShaderText(Obj3D,'.vs');
	loadShaderText(Obj3D,'.fs');
}

// =====================================================
function loadShaderText(Obj3D,ext) {   // lecture asynchrone...
  var xhttp = new XMLHttpRequest();
  
  xhttp.onreadystatechange = function() {
	if (xhttp.readyState == 4 && xhttp.status == 200) {
		if(ext=='.vs') { Obj3D.vsTxt = xhttp.responseText; Obj3D.loaded ++; }
		if(ext=='.fs') { Obj3D.fsTxt = xhttp.responseText; Obj3D.loaded ++; }
		if(Obj3D.loaded==2) {
			Obj3D.loaded ++;
			compileShaders(Obj3D);
			Obj3D.loaded ++;
		}
	}
  }
  
  Obj3D.loaded = 0;
  xhttp.open("GET", "Shaders/"+Obj3D.shaderName+ext, true);
  xhttp.send();
}

// =====================================================
function compileShaders(Obj3D)
{
	Obj3D.vshader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(Obj3D.vshader, Obj3D.vsTxt);
	gl.compileShader(Obj3D.vshader);
	if (!gl.getShaderParameter(Obj3D.vshader, gl.COMPILE_STATUS)) {
		console.log("Vertex Shader FAILED... "+Obj3D.shaderName+".vs");
		console.log(gl.getShaderInfoLog(Obj3D.vshader));
	}

	Obj3D.fshader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(Obj3D.fshader, Obj3D.fsTxt);
	gl.compileShader(Obj3D.fshader);
	if (!gl.getShaderParameter(Obj3D.fshader, gl.COMPILE_STATUS)) {
		console.log("Fragment Shader FAILED... "+Obj3D.shaderName+".fs");
		console.log(gl.getShaderInfoLog(Obj3D.fshader));
	}

	Obj3D.shader = gl.createProgram();
	gl.attachShader(Obj3D.shader, Obj3D.vshader);
	gl.attachShader(Obj3D.shader, Obj3D.fshader);
	gl.linkProgram(Obj3D.shader);
	if (!gl.getProgramParameter(Obj3D.shader, gl.LINK_STATUS)) {
		console.log("Could not initialise shaders");
		console.log(gl.getShaderInfoLog(Obj3D.shader));
	}
}


// =====================================================
function webGLStart() {
	
	var canvas = document.getElementById("WebGL-test");

	canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;
	canvas.onwheel = handleMouseWheel;

	initGL(canvas);
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	
	mat4.identity(rotMatrix);
	mat4.rotate(rotMatrix, rotX, [1, 0, 0]);
	mat4.rotate(rotMatrix, rotY, [0, 0, 1]);

	distCENTER = vec3.create([0,-0.2,-3]);
	
	PLANE = new plane();
	OBJ1 = new objmesh('sphere.obj');
	SKYBOX = new skybox();
	
	tick();
}

// =====================================================
function drawScene() {

	gl.clear(gl.COLOR_BUFFER_BIT);
	PLANE.draw();
	OBJ1.draw();
	SKYBOX.draw();
}



