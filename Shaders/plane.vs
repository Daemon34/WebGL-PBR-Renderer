attribute vec3 aVertexPosition;
attribute vec2 aTexCoords;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 texCoords;

void main(void) {
	texCoords = aTexCoords;
	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}
