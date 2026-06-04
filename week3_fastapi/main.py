from fastapi import FastAPI
from schemas import TransactionCreate, UserCreate

app = FastAPI()

@app.get("/")       # Whenever HTTPS request is made at path "/"
def read_root():       # execute this function
    return {"message": "Hello World! Welcome to your Finance API."}


@app.post("/transactions")
def create_transaction(transaction: TransactionCreate):
    # 'transaction' is now a fully validated Python object
    return {
        "status": "validated",
        "data": transaction.dict()
    }

@app.post("/users")
def create_user(user:UserCreate):
    return {"email":user.email}