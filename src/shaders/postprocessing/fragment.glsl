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


void main(){
    vec2 newUV = vUv;
    // newUV.x의 값이 특정 임계값(0.1)을 넘으면 side는 1.0이 되고, 그렇지 않으면 0.0이 됩니다.
    // float side = step(newUV.x, 0.1) + step(0.9, newUV.x);
    // float side = smoothstep(0.2, 0.0, newUV.x) + smoothstep(0.8, 1.0, newUV.x);
    // newUV.y -= (newUV.y - 0.5) * side * 0.1;
    float side = smoothstep(0.4, 0.0, vUv.y);
    newUV.x -= (newUV.x - 0.5) * side * 0.1;

    vec4 tex = texture2D(tDiffuse, newUV);
    vec4 sideColor = vec4(0.0, 0.0, side, 1.0);

    gl_FragColor = tex + sideColor;
    // gl_FragColor = vec4(0.0, 0.0, side, 1.0);
}