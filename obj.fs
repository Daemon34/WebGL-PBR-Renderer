precision mediump float;

varying vec4 pos3D;
varying vec3 N;
varying mat4 RiMatrix;

const float M_PI = 3.14159265358;

// ===========================================================================================================
// Cook et Torrance seul
// ===========================================================================================================
uniform vec2 uSRCposXY;
uniform float uSRCposZ;
uniform vec3 uSRCpow;
uniform vec3 uSRCcol;
uniform int uModele;
uniform vec3 uOBJcol;
uniform float uRugosite;
uniform float uCoeffDiffus;
uniform float uCoeffSpeculaire;
uniform float uIndiceMilieu;
uniform float uPuissanceN;

// ===========================================================================================================
// Variables Skybox et Objet Mirroir / Transparence
// ===========================================================================================================
uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
uniform sampler2D uSampler2;
uniform sampler2D uSampler3;
uniform sampler2D uSampler4;
uniform sampler2D uSampler5;
uniform int uTransparent;
uniform int uMirroir;

// ===========================================================================================================
// Cook et Torrance seul
// ===========================================================================================================
// ===========================================================================================================
float Fresnel(vec3 i, vec3 m, float indiceMilieu){
	float c = max(0.0, dot(i, m));
	if(c <= 0.0){
		return 0.0;
	}
	float g = sqrt(indiceMilieu * indiceMilieu + c * c - 1.0);

	float gMoinsC = g - c;
	float gPlusC = g + c;
	float numerateur = (c * gPlusC - 1.0) * (c * gPlusC - 1.0);
	float denominateur = (c * gMoinsC + 1.0) * (c * gMoinsC + 1.0);
	float resultat = (0.5 * ((gMoinsC * gMoinsC) / (gPlusC * gPlusC))) * (1.0 + (numerateur  / denominateur));

	return resultat;
}

// ===========================================================================================================
float DistributionGGX(vec3 m, float rugosite){
	float sigma2 = rugosite * rugosite;
	float pi = 3.14;
	float cosTeta = max(0.0, dot(N, m));
	float cosTeta2 = cosTeta * cosTeta;
	float cosTeta4 = cosTeta2 * cosTeta2;
	float sinTeta2 = 1.0 - cosTeta2;
	float tanTeta2 = sinTeta2 / cosTeta2;
	float denominateur = pi * cosTeta4 * ((sigma2 + tanTeta2) * (sigma2 + tanTeta2));
	return sigma2 / denominateur;
}

// ===========================================================================================================
float DistributionBeckmann(vec3 m, float rugosite){
	float sigma2 = rugosite * rugosite;
	float pi = 3.14;
	float cosTeta = max(0.0, dot(N, m));
	float cosTeta2 = cosTeta * cosTeta;
	float cosTeta4 = cosTeta2 * cosTeta2;
	float sinTeta2 = 1.0 - cosTeta2;
	float tanTeta2 = sinTeta2 / cosTeta2;
	float denominateur = pi * sigma2 * cosTeta4 ;
	float puissance = -tanTeta2/(2.0*sigma2);

	return (1.0 / denominateur) * exp(puissance);
}

// ===========================================================================================================
float Geometry(vec3 m,vec3 i,vec3 o){
	float a = (2.0 * max(0.0,dot(N,m)) * max(0.0,dot(N,o))) / max(0.0,dot(o,m));
	float b = (2.0 * max(0.0,dot(N,m)) * max(0.0,dot(N,i))) / max(0.0,dot(i,m));
	float min_a_b = min(a,b);

	return min(1.0, min_a_b);
}

// ===========================================================================================================
float BRDF_CookTorranceBeckmann(vec3 m, vec3 i, vec3 o, vec3 n, float rugosite, float indiceMilieu){
	return (Fresnel(i,m, indiceMilieu) * DistributionBeckmann(m, rugosite) * Geometry(m, i, o)) / (4.0 * abs(dot(i,N)) * abs(dot(o,N)));
}

// ===========================================================================================================
float BRDF_CookTorranceGGX(vec3 m, vec3 i, vec3 o, vec3 n, float rugosite, float indiceMilieu){
	return (Fresnel(i,m, indiceMilieu) * DistributionGGX(m, rugosite) * Geometry(m, i, o)) / (4.0 * abs(dot(i,N)) * abs(dot(o,N)));
}

// ==========================================================================================================
vec3 BRDF_Lambert(vec3 Kd){
	return (Kd / M_PI);
}

// ===========================================================================================================
float BRDF_ModifiedBlinnPhong(float coeffSpeculaire, float n, vec3 N, vec3 m){
	float cosAlpha = max(0.0, dot(N, m));
	float lobeSpeculaire = ((n + 8.0) / (8.0 * M_PI)) * pow(cosAlpha, n);
	return (coeffSpeculaire * lobeSpeculaire);
}

// ===========================================================================================================
// Skybox et Objet Mirroir / Transparence
// ===========================================================================================================
// ===========================================================================================================
int intersectionRayonBoite(vec3 directionRayon, out float tMin){
	int cote = 0;
	tMin = 2.0;

	// Dessus de la boite
	float t = 1.0 / directionRayon.z;
	if(t > 0.0 && t < tMin){
		tMin = t;
	}

	// Bas de la boite
	t = -1.0 / directionRayon.z;
	if(t > 0.0 && t < tMin){
		tMin = t;
		cote = 1;
	}

	// Devant de la boite
	t = 1.0 / directionRayon.y;
	if(t > 0.0 && t < tMin){
		tMin = t;
		cote = 2;
	}

	//Derriere de la boite
	t = -1.0 / directionRayon.y;
	if(t > 0.0 && t < tMin){
		tMin = t;
		cote = 3;
	}

	//Gauche de la boite
	t = -1.0 / directionRayon.x;
	if(t > 0.0 && t < tMin){
		tMin = t;
		cote = 4;
	}

	//Droite de la boite
	t = 1.0 / directionRayon.x;
	if(t > 0.0 && t < tMin){
		tMin = t;
		cote = 5;
	}

	return cote;
}

// ===============================================================================
vec3 intersectionSkyColor(vec3 directionRayon, float Min, int face){

	vec3 col;
	vec2 texCoords;

	vec3 planePos = Min * directionRayon;

	if (face == 0){
		texCoords = vec2(planePos.x,planePos.y)/2.0+0.5;
		texCoords.t = 1.0-texCoords.t;
		col = texture2D(uSampler0, vec2(texCoords.s, texCoords.t)).xyz;
	} else if (face == 1){
		texCoords = vec2(planePos.x,planePos.y)/2.0+0.5;
		col = texture2D(uSampler1, vec2(texCoords.s, texCoords.t)).xyz;
	} else if (face == 2){ 
		texCoords = vec2(planePos.x,planePos.z)/2.0+0.5;
		col = texture2D(uSampler2, vec2(texCoords.s, texCoords.t)).xyz;
	} else if (face == 3){
		texCoords = vec2(planePos.x,planePos.z)/2.0+0.5;
		texCoords.s = 1.0-texCoords.s;
		col = texture2D(uSampler3, vec2(texCoords.s, texCoords.t)).xyz;
	} else if (face == 4){
		texCoords = vec2(planePos.y,planePos.z)/2.0+0.5;
		col = texture2D(uSampler4, vec2(texCoords.s, texCoords.t)).xyz;
	} else if (face == 5){
		texCoords = vec2(planePos.y,planePos.z)/2.0+0.5;
		texCoords.s = 1.0-texCoords.s;
		col = texture2D(uSampler5, vec2(texCoords.s, texCoords.t)).xyz;
	}
	return col;
} 

// ===============================================================================
void main(void)
{
	vec3 col;

	vec3 srcPOS = vec3(uSRCposXY, uSRCposZ);
	vec3 Li = uSRCpow * uSRCcol;

	vec3 o = normalize(vec3(-vec3(pos3D)));
	vec3 i = normalize(vec3(srcPOS - vec3(pos3D)));
	vec3 m = normalize(i + o);
	float cosTeta = max(0.0, dot(N, i));

	if(uModele == 0){
		col = Li * BRDF_Lambert(uOBJcol) * cosTeta;
	} else if(uModele == 1){
		col = Li * (uCoeffDiffus * BRDF_Lambert(uOBJcol) + uCoeffSpeculaire * BRDF_ModifiedBlinnPhong(uCoeffSpeculaire, uPuissanceN, N, m)) * cosTeta;
	} else if(uModele == 2){
		col = Li * (uCoeffDiffus * BRDF_Lambert(uOBJcol) + uCoeffSpeculaire * BRDF_CookTorranceBeckmann(m, i, o, N, uRugosite, uIndiceMilieu)) * cosTeta;
	} else if(uModele == 3){
		col = Li * (uCoeffDiffus * BRDF_Lambert(uOBJcol) + uCoeffSpeculaire * BRDF_CookTorranceGGX(m, i, o, N, uRugosite, uIndiceMilieu)) * cosTeta;
	} else if(uModele == 4){
		// Reflection skybox
		vec3 MirrorDirectionObjet = reflect(-o, N);
		vec3 MirrorDirectionSkybox = vec3(RiMatrix * vec4(MirrorDirectionObjet, 1.0));
		float t;

		int face = intersectionRayonBoite(MirrorDirectionSkybox, t);
		vec3 colorSkybox = intersectionSkyColor(MirrorDirectionSkybox, t, face);
		float coefficientFresnel = Fresnel(MirrorDirectionObjet, N, uIndiceMilieu);

		// Refraction skybox
		vec3 RefractDirectionObjet = refract(-o, N, 1.0/uIndiceMilieu);
		vec3 RefractionDirectionSkybox = vec3(RiMatrix * vec4(RefractDirectionObjet, 1.0));

		int faceRefraction = intersectionRayonBoite(RefractionDirectionSkybox, t);
		vec3 colorSkyboxRefraction = intersectionSkyColor(RefractionDirectionSkybox, t, faceRefraction);
		float coefficientFresnelRefraction = 1.0 - coefficientFresnel;

		if(uTransparent == 0 && uMirroir == 0){
			col = colorSkybox * coefficientFresnel + (1.0 - coefficientFresnel) * BRDF_Lambert(uOBJcol) * dot(N, MirrorDirectionSkybox) + uOBJcol * 0.4;
		} else if(uTransparent == 0 && uMirroir == 1){
			col = colorSkybox * coefficientFresnel;
		} else if(uTransparent == 1 && uMirroir == 1){
			col = colorSkybox * coefficientFresnel + colorSkyboxRefraction * coefficientFresnelRefraction;
		} else if(uTransparent == 1 && uMirroir == 0){
			col = colorSkyboxRefraction * coefficientFresnelRefraction;
		}
	} else {
		col = vec3(0.0, 0.0, 0.0); // Il y a un problème, couleur noire.
	}

	// Tone Mapping
	col = col / (col + vec3(0.5, 0.5, 0.5));

	gl_FragColor = vec4(col,1.0);
}

