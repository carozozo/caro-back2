#!/bin/bash

source ./docker/_var.sh

# 將目前執行的 container 更名並停止
if [ "$(sudo docker ps -aqf name="${APP_NAME}")" ]; then
  printLine
  echo "Renaming ${APP_NAME} to ${TMP_APP_NAME}..."
  docker rename "${APP_NAME}" "${TMP_APP_NAME}"
  sudo docker ps -af name="${TMP_APP_NAME}"
  printLine
  # Note. 需先停止才能讓後續啟動的新 container 加入 network
  echo "Stopping ${TMP_APP_NAME}..."
  sudo docker stop "${TMP_APP_NAME}"
  sudo docker ps -af name="${TMP_APP_NAME}"
fi

# 背景啟動新 container
printLine
echo "Going to run container ${DOCKER_TAG} named ${APP_NAME}"
sudo docker run --name "${APP_NAME}" \
  --network redash_default \
  -v /home/ubuntu/.pm2/logs:/root/.pm2/logs \
  -v /home/ubuntu/yw-backend-task-mount/temp:/var/app/caro-back2/temp \
  -v /home/ubuntu/yw-backend-task-mount/uploads:/var/app/caro-back2/uploads \
  -itd "${DOCKER_TAG}"
sudo docker ps -af name="${APP_NAME}"

# 移除先前被停止的 container
if [ "$(sudo docker ps -aqf name="${TMP_APP_NAME}")" ]; then
  printLine
  echo "Removing ${TMP_APP_NAME}..."
  sudo docker rm "${TMP_APP_NAME}"
  sudo docker ps -af name="${TMP_APP_NAME}"
fi

# 嘗試清理無用的 images
if [ "$(sudo docker images -f "dangling=true" -q)" ]; then
  printLine
  echo "Cleaning untagged images..."
  sudo docker rmi "$(sudo docker images -f "dangling=true" -q)"
  sudo docker images
fi

# 確保 pm2 已啟動 service 後, 進入 container 列印 log
printLine
sleep 5
sudo docker logs -f "${APP_NAME}"
