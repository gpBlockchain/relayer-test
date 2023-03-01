FROM python:3.9

RUN mkdir /app
WORKDIR /app
COPY . .
ENV MOCK_URL="https://www.baidu.com"

CMD [ "python", "server.py" ]
