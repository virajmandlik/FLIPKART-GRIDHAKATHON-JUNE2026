# AWS Lambda container image for the Explainability Service.
# Built on the official AWS Lambda Python base image (Amazon Linux), so all
# compiled dependencies (Pillow, pydantic-core) get the correct Linux binaries.

FROM public.ecr.aws/lambda/python:3.12

# LAMBDA_TASK_ROOT is the working dir baked into the base image.
COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r requirements.txt

# Application code.
COPY app ${LAMBDA_TASK_ROOT}/app

# Mangum handler: module.path.callable
CMD ["app.main.handler"]
