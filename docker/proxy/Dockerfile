FROM python:3.9

RUN mkdir /app
WORKDIR /app
COPY . .

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ENV MOCK_URL="https://www.baidu.com"

CMD [ "python", "server.py" ]
