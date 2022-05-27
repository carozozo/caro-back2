#!/bin/bash

# Dockerfile 用到的變數
APP_NAME=caro-back2                                          # 專案名稱 for docker container
APP_ENV=prod                                                 # 啟動環境 for Dockerfile 使用
APP_PORT=8088                                                # 要啟動的 API server port; 請和 ecosystem.config.js 裡同步
FTP_PORT=21                                                  # FTP 溝通用的 port

# Docker 用到的變數
DOCKER_REG=408840679473.dkr.ecr.ap-northeast-1.amazonaws.com # 遠端 AWS ECR uri
DOCKER_TAG="${DOCKER_REG}"/"${APP_NAME}"                     # 建立出來的 docker images 的 tag name
TMP_APP_NAME=${APP_NAME}2                                    # 將舊的 docker container 更名, 讓新的 container 可以啟動
OLD_IMG_ID=                                                  # 舊的 docker container 所使用的 image

# AWS 連線設定
AWS_HOST="123.123.123.123"
AWS_USERNAME="ubuntu"
AWS_SERVER=${AWS_USERNAME}@${AWS_HOST}

# 在 AWS 時,要上傳 .sh 的路徑
DOCKER_FOLDER=docker
AWS_TMP_DIR=/tmp
AWS_TMP_DOCKER_DIR=${AWS_TMP_DIR}/${DOCKER_FOLDER}

printLine() {
  echo ""
  echo "================================================"
  echo ""
}
