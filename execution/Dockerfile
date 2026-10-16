FROM python:3.12.1-slim-bookworm@sha256:a64ac5be6928c6a94f00b16e09cdf3ba3edd44452d10ffa4516a58004873573e
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONPATH=/opt/course HOME=/tmp
WORKDIR /opt/course
COPY runner/public/python-core.tar /tmp/python-core.tar
RUN tar -xf /tmp/python-core.tar -C /opt/course && rm /tmp/python-core.tar
COPY execution/worker.py /opt/worker.py
USER 10001:10001
WORKDIR /tmp
CMD ["python", "-u", "/opt/worker.py"]
