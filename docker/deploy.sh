#!/bin/bash

source ./docker/_var.sh

# 在 AWS instance 建立暫存資料夾
printLine
echo "Trying to create temp folder path ${AWS_TMP_DOCKER_DIR} on AWS instance"
ssh -t -o StrictHostKeyChecking=no -A "${AWS_SERVER}" "\
  mkdir -p ${AWS_TMP_DOCKER_DIR}; \
"

# 將 run.sh 複制到 AWS instance 的暫存資料夾
printLine
echo "Uploading .sh files to temp folder path on AWS instance"
scp "${DOCKER_FOLDER}"/_var.sh "${AWS_SERVER}":"${AWS_TMP_DOCKER_DIR}"
scp "${DOCKER_FOLDER}"/up.sh "${AWS_SERVER}":"${AWS_TMP_DOCKER_DIR}"

# 到 AWS instance 中 pull docker images 並執行啟動程序
printLine
ssh -t -o StrictHostKeyChecking=no -A "${AWS_SERVER}" "\
  aws ecr get-login-password --region ap-northeast-1 | sudo docker login --username AWS --password-stdin ${DOCKER_REG}; \
  sudo docker pull ${DOCKER_TAG}; \
  cd ${AWS_TMP_DIR}; \
  sudo bash ${DOCKER_FOLDER}/up.sh; \
"
