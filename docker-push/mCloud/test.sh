#!/bin/bash

# Config variable =============================
# array=("stg")
array=("test" "dev" )
# array=("test" "prod" "dev" "stg")
# array=("dev")
# =============================================

for env in ${array[@]};
do

# if folder exist, then build its docker image
if [ -d "$env" ]; 
then

echo $env
docker stop mCloud

docker rm mCloud

if [ "$env" = "prod" ]
then
    docker build -f Dockerfile --pull --tag asia.gcr.io/msi-evse/$env/m-cloud:latest . --build-arg env=$env
else
    docker build -f Dockerfile --pull --tag asia.gcr.io/msi-evse/$env/m-cloud:latest . --build-arg env=$env --build-arg BUILD_DEVELOPMENT=1
fi

docker run -d -p 8082:80 --name mCloud asia.gcr.io/msi-evse/$env/m-cloud:latest

# docker save asia.gcr.io/msi-evse/$env/m-cloud:latest > m-cloud_${env}.tar
docker push asia.gcr.io/msi-evse/$env/m-cloud:latest

fi
done