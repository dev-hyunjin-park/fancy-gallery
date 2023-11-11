uniform sampler2D tDiffuse;
uniform float uTime;

varying vec2 vUv;

// 1. ripple 효과(일렁임)

// void main(){
//     vec2 toCenter = vUv - 0.5; 
//     // 중심에서 현재 좌표까지의 벡터. toCenter는 중심으로부터 각 픽셀까지의 상대적인 위치를 표현한다
//     float dist = length(toCenter);
//     // toCenter 벡터의 길이. 중심으로부터 현재 좌표까지의 거리를 나타내는 값
//     float dir = dot(toCenter, vec2(1.0, 1.0));
//     // toCenter 벡터와 (1.0, 1.0) 벡터 간의 내적(dot product)을 계산한 것
//     // dist와 dir 값은 주로 텍스처나 이미지에 특별한 변형이나 효과를 주기 위해 사용될 수 있다
//     float strenth = 0.05;

//     vec2 wave = vec2(sin(dist * 20.0), cos(dist * 20.0)); // dist * 20.0 (0~10 사이의 값)
//     vec2 newUV = vUv + wave * strenth * dir * dist;


//     vec4 tex = texture2D(tDiffuse, newUV);
//     // tex.r += 0.5;
//     gl_FragColor = tex;
// }


// 2. side
// void main(){
//     vec2 newUV = vUv;
    // newUV.x의 값이 특정 임계값(0.1)을 넘으면 side는 1.0이 되고, 그렇지 않으면 0.0이 됩니다.
    // float side = step(newUV.x, 0.1) + step(0.9, newUV.x);
    // float side = smoothstep(0.2, 0.0, newUV.x) + smoothstep(0.8, 1.0, newUV.x);
    // newUV.y -= (newUV.y - 0.5) * side * 0.1;
    // float side = smoothstep(0.4, 0.0, vUv.y);
    // newUV.x -= (newUV.x - 0.5) * side * 0.1;

    // vec4 tex = texture2D(tDiffuse, newUV);
    // vec4 sideColor = vec4(0.0, 0.0, side, 1.0);

    // gl_FragColor = tex + sideColor;
    // gl_FragColor = vec4(0.0, 0.0, side, 1.0);
// }

// Simplex 2D noise
//
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// 3. noise
void main(){
    vec2 newUV = vUv;
    float side = smoothstep(0.2, 0.0, newUV.y) + smoothstep(0.8, 1.0, newUV.y);
    float noise = snoise(newUV * 500.0 + uTime * 2.0);
    newUV.x -= side * 0.1 * noise;
    // newUV.x *= snoise(newUV * 500.0);
    vec4 tex = texture2D(tDiffuse, newUV);
    tex += noise;
    vec4 sideColor = vec4(0.0, 0.0, side, 1.0);

    gl_FragColor = tex;
}