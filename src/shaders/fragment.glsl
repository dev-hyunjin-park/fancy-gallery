uniform sampler2D uTexture;
uniform float uTime;
uniform float uHover;

varying vec2 vUv;

void main()
{
    vec2 toCenter = vUv - 0.5; 
    // 중심에서 현재 좌표까지의 벡터. toCenter는 중심으로부터 각 픽셀까지의 상대적인 위치를 표현한다
    float dist = length(toCenter);
    // toCenter 벡터의 길이. 중심으로부터 현재 좌표까지의 거리를 나타내는 값
    float dir = dot(toCenter, vec2(1.0, 1.0));
    // toCenter 벡터와 (1.0, 1.0) 벡터 간의 내적(dot product)을 계산한 것
    // dist와 dir 값은 주로 텍스처나 이미지에 특별한 변형이나 효과를 주기 위해 사용될 수 있다
    float strenth = 0.5;

    vec2 wave = vec2(sin(dist * 20.0 - uTime * 5.0), cos(dist * 20.0 - uTime * 5.0)); // dist * 20.0 (0~10 사이의 값)
    vec2 newUV = vUv + wave * strenth * dir * dist * uHover;

    // 전달받은 실제 이미지를 쉐이더 텍스처에 적용
    vec4 tex = texture2D(uTexture, newUV);
    gl_FragColor = tex;
    
}