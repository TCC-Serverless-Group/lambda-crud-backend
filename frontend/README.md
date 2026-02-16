# lambda-crud-frontend
A React frontend project for a aws serverless crud

### set api gateway endpoint

set REACT_APP_API_BASE_URL in .env file with a api gateway generated url after deploy backend

### To build project
> npm run build

### To upload frontend project to a S3 bucket
> aws s3 sync build/ s3://todolist-dev-spa-bucket-891377077355 --delete