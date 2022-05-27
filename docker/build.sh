#!/bin/bash

source ./docker/_var.sh

## 基本版 build image
#printLine
#echo "Buildup image by [build]"
#docker build \
#  --build-arg APP_ENV="${APP_ENV}" \
#  --build-arg APP_PORT="${APP_PORT}" \
#  --build-arg APP_NAME="${APP_NAME}" \
#  --build-arg FTP_PORT="${FTP_PORT}" \
#  -f docker/Dockerfile \
#  -t="${DOCKER_TAG}" .

## 跨平台版 build image (for 相容 ARM 架構也可建立 x86 架構的 images)
printLine
echo "Use default buildx setting"
docker buildx use default

printLine
echo "Buildup image by [buildx]"
docker buildx build \
  --platform linux/amd64 \
  --build-arg APP_ENV="${APP_ENV}" \
  --build-arg APP_PORT="${APP_PORT}" \
  --build-arg APP_NAME="${APP_NAME}" \
  --build-arg FTP_PORT="${FTP_PORT}" \
  --load \
  -f docker/Dockerfile \
  -t="${DOCKER_TAG}" .

# 嘗試清理無用的 images
printLine
if [ "$(docker images -f "dangling=true" -q)" ]; then
  echo "Cleaning untagged images..."
  docker rmi "$(docker images -f "dangling=true" -q)"
  docker images
fi
