# WebGL PBR Renderer

This project is a Real-time PBR Renderer for WebBrowser using WebGL. It allows rendering using :
  - Lambertian model
  - Modified Phong, also called Blinn-Phong, model, where you can modify Diffuse and Specular parameters
  - Cook-Torrance microfacet model, using Beckmann Distribution, where you can modify Diffuse, Specular, Roughness and choose between Glass, Water or Titanium materials
  - The same microfact model as above, but using the GGX distribution
  - Real-time mirror or transparency of an object
  
You can always modify the color of the light or the object, and the Z position of the light.
There are 3 available models : The teapot, the bunny and the sphere

## How to use this project ?

Since this project is based on WebGL you need :
  - A web server hosting this project (You can use [Web Server for Chrome](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb) for example for a local server)
  - A web browser to be able to access main.html
  
## Examples

### Lambertian
![image](https://user-images.githubusercontent.com/66914830/222870974-1a243321-4794-4805-979c-43f863f378f0.png)

### Cook-Torrance with GGX Distribution
Very high specular and roughness values
![image](https://user-images.githubusercontent.com/66914830/222871088-243007ab-0ae7-4819-a11a-68b5891e3018.png)

High specular value, but low roughness value
![image](https://user-images.githubusercontent.com/66914830/222871142-95e152c0-3fb2-49e9-a06c-224fbf24122f.png)

### Reflections
![image](https://user-images.githubusercontent.com/66914830/222872379-910ce4c5-362b-46f9-b497-06ae8742f1b0.png)

### Refractions
![image](https://user-images.githubusercontent.com/66914830/222872459-6e16063c-db33-4d44-8afa-caf9f505af55.png)

