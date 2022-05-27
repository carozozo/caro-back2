#!/bin/bash

source ./docker/_var.sh

# push docker images 到 AWS ECR
printLine
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin "${DOCKER_REG}"
docker push "${DOCKER_TAG}"
