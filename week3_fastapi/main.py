from fastapi import FastAPI

app = FastAPI()

@app.get("/")       # Whenever HTTPS request is made at path "/"
def read_root():       # execute this function
    return {"message": "Hello World! Welcome to your Finance API."}
