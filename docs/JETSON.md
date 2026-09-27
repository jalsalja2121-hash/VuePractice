# Jetson 장비 실습으로 확장하기

현재 웹 실습은 장비 없이 흐름을 익히는 로컬 시뮬레이션입니다. 실제 YOLO 추론, TensorRT 엔진 실행, DeepStream, ROS 2, Nvblox를 실행하거나 장비에 접속하지 않습니다. 프레임·탐지 박스는 합성 예제이며 처리량은 단순 계산값입니다.

## 역할 분리

- Vue: 카메라 상태, 탐지 결과, 지도 및 사용자 조작을 표시하는 화면.
- Jetson 또는 호환 NVIDIA GPU PC: 영상 수집, AI 추론, 깊이 지도 처리.
- 중계 서버: 인증된 HTTP/WebSocket으로 결과를 웹에 전달. ROS 2를 인터넷에 직접 노출하지 않습니다.
- Firebase: 로그인과 사용자별 학습 메모. 원본 영상의 고빈도 전송 수단으로 쓰지 않습니다.

## 장비가 생기면 진행할 순서

1. 보드가 구형 Jetson Nano인지 Orin Nano인지 먼저 확인합니다. 보드 이름이 비슷해도 지원 JetPack/CUDA/TensorRT/Isaac ROS 조합이 다릅니다.
2. NVIDIA 공식 지원표에서 보드·JetPack·ROS 배포판·컨테이너 버전 조합을 정합니다. 이 저장소는 특정 버전을 강제로 설치하는 스크립트를 포함하지 않습니다.
3. 카메라 한 대, 낮은 해상도부터 입력이 정상인지 검증합니다.
4. YOLO 화재/연기 모델의 라이선스, 가중치와 클래스 이름을 확인합니다. 실제 환경의 정상/화재 영상을 별도로 검증하고 오탐·미탐을 기록합니다. 이 학습 데모를 화재 경보 장치로 쓰지 않습니다.
5. 타깃 장비에 맞춰 TensorRT 엔진을 생성하고 FP32/FP16 결과부터 비교합니다. INT8은 모델·런타임이 지원하는 양자화 방식과 대표 데이터를 확인한 뒤 정확도를 재검증합니다. 다른 GPU에서 만든 엔진의 호환성을 가정하지 않습니다.
6. DeepStream으로 디코딩 → 전처리 → 추론 → 후처리를 연결합니다. 먼저 1개 스트림에서 지연, FPS, GPU 메모리를 측정한 다음 입력 수를 늘립니다.
7. Nvblox는 RGB/깊이와 카메라 자세, 시간 동기화, 카메라 보정 및 좌표계 연결을 검증한 뒤 실행합니다. 일반 RGB 카메라만 꽂으면 자동으로 정확한 깊이 지도가 만들어지는 것은 아닙니다.
8. 중계 서버에서 결과를 전달하고 웹의 합성 예제를 실제 수신 데이터로 교체합니다. 연결이 끊기면 마지막 데이터를 현재 결과처럼 보여주지 않고 연결 끊김/오래된 데이터 상태를 표시합니다.

## 향후 중계 서버 메시지 예시 (이 프로젝트가 제안하는 형식)

아래는 NVIDIA나 ROS의 표준 API가 아니며, 아직 구현된 엔드포인트도 아닙니다. 박스 좌표는 0~1 정규화 좌표입니다.

```json
{
  "type": "detections",
  "source": "jetson-camera-01",
  "timestamp": "2026-09-27T11:00:00Z",
  "frameId": 120,
  "detections": [
    { "label": "fire", "confidence": 0.91, "box": [0.2, 0.3, 0.1, 0.2] }
  ]
}
```

## 공식 자료

- Isaac ROS Nvblox: https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_nvblox
- Isaac ROS 시작하기: https://nvidia-isaac-ros.github.io/getting_started/index.html
- DeepStream: https://developer.nvidia.com/deepstream-sdk
- TensorRT: https://developer.nvidia.com/tensorrt
- JetPack: https://developer.nvidia.com/embedded/jetpack
- 수집한 커뮤니티 YOLO 예제: https://github.com/Abonia1/YOLOv8-Fire-and-Smoke-Detection
