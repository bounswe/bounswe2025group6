FROM ubuntu AS build

RUN apt-get update
RUN apt-get install -y wget curl git unzip android-sdk

ENV ANDROID_HOME="/usr/lib/android-sdk"

RUN wget https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip

RUN unzip commandlinetools-linux-13114758_latest.zip -d cmdline-tools

RUN mkdir --parents "$ANDROID_HOME/cmdline-tools/latest"

RUN mv cmdline-tools/* "$ANDROID_HOME/cmdline-tools/latest/"

ENV PATH=$ANDROID_HOME/cmdline-tools/latest/cmdline-tools/bin:$PATH

RUN sh -c "yes | /usr/lib/android-sdk/cmdline-tools/latest/cmdline-tools/bin/sdkmanager --sdk_root=$ANDROID_HOME --licenses"


RUN git clone https://github.com/flutter/flutter.git 
ENV PATH="/flutter/bin:${PATH}"
COPY . /app
WORKDIR /app

ARG API_URL

RUN flutter clean
RUN flutter build apk --dart-define=API_URL=$API_URL


FROM scratch
COPY --from=build /app/build/app/outputs/apk/release/app-release.apk /
ENTRYPOINT ["/app-release.apk"]
